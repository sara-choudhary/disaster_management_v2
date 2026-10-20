import heapq
from typing import Dict, List, Optional, Tuple, Set, Any
from sqlalchemy.orm import Session
from app.models import NetworkNode, NetworkLink, Department


class RoutingEngine:
    """
    Deterministic Graph-Based Routing Engine.
    Implements Dijkstra's shortest-path algorithm with positive configurable link costs.
    Models an OSPF-inspired link-state routing simulation.
    """

    def __init__(self, db: Session):
        self.db = db
        self._build_graph()

    def _build_graph(self):
        """Builds adjacency graph strictly from operational nodes and links in the database."""
        self.nodes: Dict[str, NetworkNode] = {}
        self.links: Dict[str, NetworkLink] = {}
        self.adj: Dict[str, List[Tuple[str, int, float, str]]] = {}  # u -> list of (v, cost, latency, link_id)

        # Query all active, non-failed nodes
        active_nodes = (
            self.db.query(NetworkNode)
            .filter(NetworkNode.is_active == True, NetworkNode.status != "failed")
            .all()
        )
        for node in active_nodes:
            self.nodes[node.device_id] = node
            self.adj[node.device_id] = []

        # Query all active, non-failed links
        active_links = (
            self.db.query(NetworkLink)
            .filter(NetworkLink.is_active == True, NetworkLink.status == "up")
            .all()
        )
        for link in active_links:
            # Both source and target must be operational
            if link.source_id in self.nodes and link.target_id in self.nodes:
                self.links[link.link_id] = link
                self.adj[link.source_id].append(
                    (link.target_id, link.cost, link.latency, link.link_id)
                )

    def resolve_device_id(self, identifier: str) -> Optional[str]:
        """
        Resolves an identifier (device_id, department name, or department code)
        to a concrete network node device_id.
        """
        if identifier in self.nodes:
            return identifier

        # Check by node name
        node = self.db.query(NetworkNode).filter(NetworkNode.name.ilike(f"%{identifier}%")).first()
        if node and node.device_id in self.nodes:
            return node.device_id

        # Check by department code or name
        dept = (
            self.db.query(Department)
            .filter(
                (Department.department_code == identifier)
                | (Department.name.ilike(f"%{identifier}%"))
            )
            .first()
        )
        if dept:
            # Return primary switch or server for this department
            primary_node = (
                self.db.query(NetworkNode)
                .filter(NetworkNode.department == dept.name)
                .order_by(NetworkNode.node_type == "switch")
                .first()
            )
            if primary_node:
                return primary_node.device_id

        return None

    def dijkstra_shortest_path(
        self,
        source: str,
        destination: str,
        excluded_link_ids: Optional[Set[str]] = None,
    ) -> Dict[str, Any]:
        """
        Calculates the lowest-cost path between source and destination using Dijkstra's algorithm.
        Returns path hops, total metric cost, estimated latency, and reachability.
        """
        if excluded_link_ids is None:
            excluded_link_ids = set()

        src_id = self.resolve_device_id(source)
        dst_id = self.resolve_device_id(destination)

        if not src_id or not dst_id:
            return {
                "source": source,
                "destination": destination,
                "reachable": False,
                "path": [],
                "hops": 0,
                "total_cost": 0,
                "total_latency": 0.0,
                "is_alternate_path": False,
                "details": f"Node lookup failed for source '{source}' or destination '{destination}'.",
            }

        if src_id == dst_id:
            return {
                "source": src_id,
                "destination": dst_id,
                "reachable": True,
                "path": [src_id],
                "hops": 0,
                "total_cost": 0,
                "total_latency": 0.0,
                "is_alternate_path": False,
                "details": "Source and destination are identical.",
            }

        # Priority Queue: (cumulative_cost, cumulative_latency, current_node, path_nodes)
        pq = [(0, 0.0, src_id, [src_id])]
        min_costs: Dict[str, int] = {src_id: 0}
        best_path: Optional[List[str]] = None
        best_latency = 0.0
        best_cost = float("inf")

        while pq:
            cost, lat, current, path = heapq.heappop(pq)

            if current == dst_id:
                best_path = path
                best_cost = cost
                best_latency = lat
                break

            if cost > min_costs.get(current, float("inf")):
                continue

            for neighbor, link_cost, link_lat, link_id in self.adj.get(current, []):
                if link_id in excluded_link_ids:
                    continue

                new_cost = cost + link_cost
                new_lat = lat + link_lat

                if new_cost < min_costs.get(neighbor, float("inf")):
                    min_costs[neighbor] = new_cost
                    heapq.heappush(pq, (new_cost, new_lat, neighbor, path + [neighbor]))

        if best_path:
            return {
                "source": src_id,
                "destination": dst_id,
                "reachable": True,
                "path": best_path,
                "hops": len(best_path) - 1,
                "total_cost": best_cost,
                "total_latency": round(best_latency, 2),
                "is_alternate_path": len(excluded_link_ids) > 0,
                "details": f"Deterministic shortest path computed with metric cost {best_cost}.",
            }
        else:
            return {
                "source": src_id,
                "destination": dst_id,
                "reachable": False,
                "path": [],
                "hops": 0,
                "total_cost": 0,
                "total_latency": 0.0,
                "is_alternate_path": len(excluded_link_ids) > 0,
                "details": f"Destination '{dst_id}' is unreachable from '{src_id}' under current topology constraints.",
            }

    def compute_primary_and_alternate_paths(
        self, source: str, destination: str
    ) -> Dict[str, Any]:
        """
        Computes the primary shortest path, then simulates failure of primary transit
        links to find the deterministic alternate path.
        """
        primary = self.dijkstra_shortest_path(source, destination)
        if not primary["reachable"] or primary["hops"] <= 1:
            return {
                "primary": primary,
                "alternate": None,
                "has_redundancy": False,
            }

        # Identify links used in primary path
        primary_path = primary["path"]
        links_to_exclude = set()
        for i in range(len(primary_path) - 1):
            u, v = primary_path[i], primary_path[i + 1]
            links_to_exclude.add(f"L-{u}-{v}")
            links_to_exclude.add(f"L-{v}-{u}")

        # Compute alternate route avoiding primary transit
        alternate = self.dijkstra_shortest_path(
            source, destination, excluded_link_ids=links_to_exclude
        )
        alternate["is_alternate_path"] = True

        return {
            "primary": primary,
            "alternate": alternate if alternate["reachable"] else None,
            "has_redundancy": alternate["reachable"],
        }

    def evaluate_all_department_reachability(self) -> Dict[str, Any]:
        """
        Evaluates reachability between all 7 emergency department gateways.
        Returns total reachable pairs, unreachable pairs, and reachability percentage.
        """
        departments = self.db.query(Department).all()
        dept_nodes = {}
        for d in departments:
            # Find switch for department
            node = (
                self.db.query(NetworkNode)
                .filter(NetworkNode.department == d.name)
                .first()
            )
            if node:
                dept_nodes[d.department_code] = node.device_id

        total_pairs = 0
        reachable_pairs = 0
        unreachable = []

        codes = list(dept_nodes.keys())
        for i in range(len(codes)):
            for j in range(len(codes)):
                if i != j:
                    total_pairs += 1
                    src_code, dst_code = codes[i], codes[j]
                    res = self.dijkstra_shortest_path(
                        dept_nodes[src_code], dept_nodes[dst_code]
                    )
                    if res["reachable"]:
                        reachable_pairs += 1
                    else:
                        unreachable.append(f"{src_code} -> {dst_code}")

        availability_pct = (
            round((reachable_pairs / total_pairs) * 100, 1) if total_pairs > 0 else 0.0
        )
        return {
            "total_pairs": total_pairs,
            "reachable_pairs": reachable_pairs,
            "unreachable_pairs": unreachable,
            "availability_percentage": availability_pct,
            "is_fully_connected": len(unreachable) == 0,
        }
