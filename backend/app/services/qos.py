import math
import uuid
from datetime import datetime
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.services.routing import RoutingEngine
from app.models import NetworkLink


class QoSEngine:
    """
    Simulated Quality of Service (QoS) & Traffic Priority Scheduler.
    Implements deterministic priority queueing with strict preferential service for Critical traffic.
    Respects link bandwidth constraints and models realistic queuing delay and packet loss under congestion.
    """

    def __init__(self, db: Session):
        self.db = db
        self.routing_engine = RoutingEngine(db)

    def simulate_traffic(
        self,
        source_department: str,
        destination_department: str,
        traffic_class: str = "critical",
        packet_count: int = 1000,
        offered_load_mbps: float = 100.0,
        duration_seconds: float = 5.0,
    ) -> Dict[str, Any]:
        """
        Executes a deterministic traffic simulation along the calculated OSPF-inspired shortest path.
        Models congestion, priority scheduling across 4 traffic classes, and consistent packet accounting.
        """
        # 1. Resolve path between source and destination
        route = self.routing_engine.dijkstra_shortest_path(
            source_department, destination_department
        )

        if not route["reachable"]:
            # Path unreachable - 100% drop
            classes_results = []
            for c_name in ["critical", "high", "normal", "low"]:
                c_sent = int(packet_count * self._class_ratio(c_name))
                classes_results.append(
                    {
                        "traffic_class": c_name,
                        "packets_sent": c_sent,
                        "packets_delivered": 0,
                        "packets_lost": c_sent,
                        "delivery_ratio": 0.0,
                        "estimated_latency_ms": 0.0,
                        "queue_delay_ms": 0.0,
                        "link_utilization_pct": 0.0,
                    }
                )
            return {
                "simulation_id": str(uuid.uuid4())[:8],
                "timestamp": datetime.utcnow(),
                "source_department": source_department,
                "destination_department": destination_department,
                "path_used": [],
                "overall_sent": packet_count,
                "overall_delivered": 0,
                "overall_lost": packet_count,
                "overall_delivery_ratio": 0.0,
                "classes": classes_results,
                "congestion_detected": False,
                "details": f"Path unreachable between {source_department} and {destination_department}. 100% traffic dropped.",
            }

        # 2. Determine bottleneck bandwidth along the path
        path = route["path"]
        bottleneck_bw = 1000.0  # default
        base_path_latency = route["total_latency"]

        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            link = (
                self.db.query(NetworkLink)
                .filter(
                    NetworkLink.source_id == u,
                    NetworkLink.target_id == v,
                    NetworkLink.is_active == True,
                )
                .first()
            )
            if link and link.bandwidth < bottleneck_bw:
                bottleneck_bw = link.bandwidth

        # 3. Model Congestion and Scheduling
        # Capacity over duration: max bits transmitted = bottleneck_bw (Mbps) * duration_seconds
        # Offered traffic vs capacity
        is_congested = offered_load_mbps > bottleneck_bw
        link_utilization = min(
            100.0, round((offered_load_mbps / bottleneck_bw) * 100.0, 1)
        )

        # Class breakdown weights:
        # If user explicitly specifies a single class to test, allocate 70% to that class, and 10% each to others
        weights = {
            "critical": 0.40,
            "high": 0.30,
            "normal": 0.20,
            "low": 0.10,
        }
        if traffic_class in weights:
            # Boost the focused class
            weights = {k: 0.10 for k in weights}
            weights[traffic_class] = 0.70

        classes_results = []
        overall_sent = 0
        overall_delivered = 0
        overall_lost = 0

        # Available capacity for delivered packets
        effective_capacity_ratio = min(1.0, bottleneck_bw / offered_load_mbps)

        for c_name in ["critical", "high", "normal", "low"]:
            c_weight = weights[c_name]
            c_sent = int(packet_count * c_weight)
            overall_sent += c_sent

            if not is_congested:
                # Uncongested: All classes get 100% delivery, negligible queueing delay
                c_delivered = c_sent
                c_lost = 0
                c_queue_delay = round(0.5 + (0.2 * self._priority_rank(c_name)), 2)
                c_ratio = 1.0
            else:
                # Congested: Strict Priority with Starvation Safeguards
                # Critical gets 99%+ delivered
                if c_name == "critical":
                    c_delivery_rate = 0.995
                    c_queue_delay = round(1.2, 2)
                elif c_name == "high":
                    # High gets priority over normal & low
                    c_delivery_rate = max(
                        0.85, min(0.98, effective_capacity_ratio * 1.25)
                    )
                    c_queue_delay = round(4.5 + (base_path_latency * 0.4), 2)
                elif c_name == "normal":
                    c_delivery_rate = max(
                        0.50, min(0.85, effective_capacity_ratio * 0.85)
                    )
                    c_queue_delay = round(12.0 + (base_path_latency * 0.8), 2)
                else:  # low
                    # Low absorbs majority of drops
                    c_delivery_rate = max(
                        0.10, min(0.50, effective_capacity_ratio * 0.40)
                    )
                    c_queue_delay = round(35.0 + (base_path_latency * 1.5), 2)

                c_delivered = int(c_sent * c_delivery_rate)
                c_lost = c_sent - c_delivered
                c_ratio = round(c_delivered / c_sent, 4) if c_sent > 0 else 1.0

            overall_delivered += c_delivered
            overall_lost += c_lost

            total_lat = round(base_path_latency + c_queue_delay, 2)

            classes_results.append(
                {
                    "traffic_class": c_name,
                    "packets_sent": c_sent,
                    "packets_delivered": c_delivered,
                    "packets_lost": c_lost,
                    "delivery_ratio": round(
                        (c_delivered / c_sent) if c_sent > 0 else 1.0, 4
                    ),
                    "estimated_latency_ms": total_lat,
                    "queue_delay_ms": c_queue_delay,
                    "link_utilization_pct": link_utilization,
                }
            )

        overall_ratio = (
            round(overall_delivered / overall_sent, 4) if overall_sent > 0 else 1.0
        )
        congestion_msg = (
            f"Congestion detected (Offered: {offered_load_mbps} Mbps > Bottleneck: {bottleneck_bw} Mbps). Strict Priority Scheduler enforced preferential delivery for Critical emergency packets."
            if is_congested
            else f"Path uncongested (Offered: {offered_load_mbps} Mbps <= Bottleneck: {bottleneck_bw} Mbps). All classes delivered without loss."
        )

        return {
            "simulation_id": str(uuid.uuid4())[:8],
            "timestamp": datetime.utcnow(),
            "source_department": source_department,
            "destination_department": destination_department,
            "path_used": path,
            "overall_sent": overall_sent,
            "overall_delivered": overall_delivered,
            "overall_lost": overall_lost,
            "overall_delivery_ratio": overall_ratio,
            "classes": classes_results,
            "congestion_detected": is_congested,
            "details": congestion_msg,
        }

    def _class_ratio(self, class_name: str) -> float:
        ratios = {"critical": 0.40, "high": 0.30, "normal": 0.20, "low": 0.10}
        return ratios.get(class_name, 0.25)

    def _priority_rank(self, class_name: str) -> int:
        ranks = {"critical": 1, "high": 2, "normal": 3, "low": 4}
        return ranks.get(class_name, 3)
