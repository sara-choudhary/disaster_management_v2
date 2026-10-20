import uuid
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models import AccessRule, NetworkEvent, Alert, Department


class SecurityEngine:
    """
    Departmental Access Control (ACL) & Educational Security Demonstration Engine.
    Models firewall ACL rules, DHCP pool allocation, Switch Port Security (MAC filtering),
    and simulated administrative SSH access control.
    """

    def __init__(self, db: Session):
        self.db = db

    def evaluate_access(
        self,
        source_dept: str,
        destination_dept: str,
        source_ip: str,
        destination_ip: str,
        protocol: str = "TCP",
        port: Optional[int] = 80,
    ) -> Dict[str, Any]:
        """
        Evaluates an inbound traffic request against active ACL rules ordered by rule_order.
        Distinguishes network reachability from authorization.
        Persists DENY events to NetworkEvent and Alert tables.
        """
        rules = (
            self.db.query(AccessRule)
            .filter(AccessRule.is_enabled == True)
            .order_by(AccessRule.rule_order.asc())
            .all()
        )

        matched_rule: Optional[AccessRule] = None
        action = "PERMIT"  # default fallthrough if no rule matches
        reason = "Default permit: no blocking rule encountered."

        for rule in rules:
            src_match = (
                rule.source_department == "ANY"
                or rule.source_department.lower() == source_dept.lower()
            )
            dst_match = (
                rule.destination_department == "ANY"
                or rule.destination_department.lower() == destination_dept.lower()
            )
            proto_match = (
                rule.protocol == "ANY" or rule.protocol.upper() == protocol.upper()
            )

            ip_dst_match = True
            if rule.destination_ip != "ANY":
                # Check exact IP or subnet prefix
                rule_ip_prefix = rule.destination_ip.split("/")[0]
                if (
                    destination_ip != rule_ip_prefix
                    and not destination_ip.startswith(rule_ip_prefix.rsplit(".", 1)[0])
                ):
                    ip_dst_match = False

            if src_match and dst_match and proto_match and ip_dst_match:
                matched_rule = rule
                action = rule.action
                reason = f"Matched ACL Rule {rule.rule_id} (Order {rule.rule_order}): {rule.description}"
                break

        allowed = action == "PERMIT"
        event_logged = False

        if not allowed:
            # Persist security violation event
            evt_id = f"SEC-{str(uuid.uuid4())[:8]}"
            event = NetworkEvent(
                event_id=evt_id,
                timestamp=datetime.utcnow(),
                event_type="ACL_DENIED",
                severity="suspicious",
                resource_id=f"{source_dept}->{destination_dept}",
                description=f"Unauthorized communication blocked: {source_dept} ({source_ip}) -> {destination_dept} ({destination_ip}:{port} {protocol}). Rule: {matched_rule.rule_id if matched_rule else 'DEFAULT'}",
                event_metadata=json.dumps(
                    {
                        "source_dept": source_dept,
                        "destination_dept": destination_dept,
                        "source_ip": source_ip,
                        "destination_ip": destination_ip,
                        "protocol": protocol,
                        "port": port,
                        "rule_id": matched_rule.rule_id if matched_rule else None,
                    }
                ),
            )
            self.db.add(event)

            # Persist alert
            alert = Alert(
                alert_id=f"ALT-SEC-{str(uuid.uuid4())[:6]}",
                timestamp=datetime.utcnow(),
                severity="suspicious",
                category="security",
                affected_resource=f"{destination_dept} Gateway",
                description=f"Security ACL Violation: Traffic dropped from {source_dept} to {destination_dept} on port {port}.",
                status="open",
            )
            self.db.add(alert)
            self.db.commit()
            event_logged = True

        return {
            "allowed": allowed,
            "matched_rule": matched_rule,
            "action": action,
            "reason": reason,
            "security_event_logged": event_logged,
        }

    # -------------------------------------------------------------
    # Educational Demonstrations: DHCP Simulation
    # -------------------------------------------------------------
    def get_dhcp_pools(self) -> List[Dict[str, Any]]:
        """Returns modeled DHCP configuration for all departmental subnets."""
        departments = self.db.query(Department).all()
        pools = []
        for d in departments:
            # Subnet base e.g. 192.168.10.0
            base = d.subnet.split(".")[0:3]
            prefix = ".".join(base)
            pools.append(
                {
                    "department": d.name,
                    "vlan_id": d.vlan_id,
                    "subnet": d.subnet,
                    "gateway": d.gateway,
                    "pool_start": f"{prefix}.100",
                    "pool_end": f"{prefix}.200",
                    "total_leases": 101,
                    "active_leases": 14,
                    "dns_server": "192.168.10.50",
                    "lease_time_hrs": 24,
                }
            )
        return pools

    def simulate_dhcp_allocation(
        self, department_name: str, client_hostname: str, client_mac: str
    ) -> Dict[str, Any]:
        """Simulates DHCP dynamic IP address assignment or pool exhaustion test."""
        dept = (
            self.db.query(Department)
            .filter(
                (Department.name.ilike(f"%{department_name}%"))
                | (Department.department_code == department_name)
            )
            .first()
        )
        if not dept:
            return {
                "success": False,
                "department": department_name,
                "allocated_ip": None,
                "subnet": "Unknown",
                "gateway": "Unknown",
                "dns": "Unknown",
                "message": f"Department '{department_name}' not found.",
            }

        prefix = ".".join(dept.subnet.split(".")[0:3])
        # Deterministic IP hash based on MAC
        mac_hash = sum(ord(c) for c in client_mac) % 90 + 105
        assigned_ip = f"{prefix}.{mac_hash}"

        return {
            "success": True,
            "department": dept.name,
            "allocated_ip": assigned_ip,
            "subnet": dept.subnet,
            "gateway": dept.gateway,
            "dns": "192.168.10.50 (ECC Primary DNS)",
            "message": f"DHCP ACK: Leased IP {assigned_ip} to {client_hostname} [{client_mac}] on VLAN {dept.vlan_id}.",
        }

    # -------------------------------------------------------------
    # Educational Demonstrations: Switch Port Security
    # -------------------------------------------------------------
    def test_port_security(
        self, switch_id: str, port_number: int, mac_address: str
    ) -> Dict[str, Any]:
        """
        Simulates 802.1X / MAC address sticky port security on department access switches.
        Allowed MAC addresses start with standard vendor OUIs (e.g., '00:50:56', '02:00:00').
        Unknown/rogue MACs trigger port shutdown violation.
        """
        # Modeled authorized MAC database
        authorized_ouis = ["00:50:56", "02:00:00", "52:54:00", "08:00:27"]
        clean_mac = mac_address.lower().strip()
        is_authorized = any(clean_mac.startswith(oui) for oui in authorized_ouis)

        if is_authorized:
            return {
                "allowed": True,
                "switch_id": switch_id,
                "port_number": port_number,
                "mac_address": mac_address,
                "action_taken": "FORWARDING",
                "security_event_id": None,
                "message": f"Port Security OK: MAC {mac_address} verified on {switch_id} FastEthernet0/{port_number}.",
            }
        else:
            evt_id = f"SEC-MAC-{str(uuid.uuid4())[:6]}"
            evt = NetworkEvent(
                event_id=evt_id,
                timestamp=datetime.utcnow(),
                event_type="PORT_SECURITY_VIOLATION",
                severity="critical",
                resource_id=f"{switch_id}:Fa0/{port_number}",
                description=f"Port Security Violation: Unauthorized MAC {mac_address} detected on {switch_id} port {port_number}. Interface disabled (err-disable).",
                event_metadata=json.dumps(
                    {
                        "switch_id": switch_id,
                        "port_number": port_number,
                        "rogue_mac": mac_address,
                    }
                ),
            )
            self.db.add(evt)
            self.db.commit()

            return {
                "allowed": False,
                "switch_id": switch_id,
                "port_number": port_number,
                "mac_address": mac_address,
                "action_taken": "ERR_DISABLE (Port Shutdown)",
                "security_event_id": evt_id,
                "message": f"PORT SHUTDOWN: Rogue device {mac_address} blocked on {switch_id} port {port_number}. Security alert recorded.",
            }

    # -------------------------------------------------------------
    # Educational Demonstrations: Modeled SSH Management
    # -------------------------------------------------------------
    def test_ssh_access(
        self, target_device: str, username: str, source_ip: str
    ) -> Dict[str, Any]:
        """
        Demonstrates role-based SSH remote administration access control.
        Only admin from Emergency Control Center subnet (192.168.10.0/24) or Backup Command (192.168.70.0/24)
        is granted terminal session.
        """
        is_admin_subnet = source_ip.startswith("192.168.10.") or source_ip.startswith(
            "192.168.70."
        )
        is_admin_user = username.lower() in ["admin", "netadmin", "sysadmin"]

        if is_admin_subnet and is_admin_user:
            return {
                "success": True,
                "target_device": target_device,
                "session_allowed": True,
                "reason": "Authorized SSH key exchange from designated administrative management subnet.",
                "message": f"SSH-2.0 Session established to {target_device} for user '{username}' from {source_ip} (VLAN 10/70 Management).",
            }
        else:
            reason = (
                f"Unauthorized subnet {source_ip} denied by SSH VTY access-class filter."
                if not is_admin_subnet
                else f"Invalid credentials/role for user '{username}'."
            )

            evt = NetworkEvent(
                event_id=f"SEC-SSH-{str(uuid.uuid4())[:6]}",
                timestamp=datetime.utcnow(),
                event_type="UNAUTHORIZED_SSH_ATTEMPT",
                severity="warning",
                resource_id=target_device,
                description=f"SSH login rejected on {target_device}: User '{username}' from unauthorized IP {source_ip}.",
                event_metadata=json.dumps(
                    {
                        "target_device": target_device,
                        "username": username,
                        "source_ip": source_ip,
                    }
                ),
            )
            self.db.add(evt)
            self.db.commit()

            return {
                "success": False,
                "target_device": target_device,
                "session_allowed": False,
                "reason": reason,
                "message": f"SSH connection refused on {target_device}: {reason}",
            }
