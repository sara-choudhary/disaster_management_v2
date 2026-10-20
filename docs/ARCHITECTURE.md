# Architecture Specification — Disaster-Resistant Emergency Communication Network with Priority Routing

## 1. System Overview

The **Disaster-Resistant Emergency Communication Network** is an academic, full-stack network simulation platform designed to demonstrate resilient inter-departmental emergency communication during critical infrastructure disruptions.

The architecture emphasizes:
1. **Redundant Network Topology:** A 4-core router ring topology with cross-mesh links connecting 7 municipal emergency departments.
2. **OSPF-Inspired Link-State Routing:** Deterministic shortest-path calculations using Dijkstra's algorithm, with automatic failover to alternate paths upon link/node failure.
3. **Quality of Service (QoS) & Traffic Prioritization:** Deterministic priority queuing that models link congestion, starvation safeguards, and guarantees preferential delivery for critical medical telemetry and ambulance dispatch.
4. **Departmental Access Control (ACL) & Security:** Configurable VLAN/subnet segmentation, access control evaluation, and educational demonstrations (DHCP lease allocation, Switch Port Security MAC filtering, and administrative SSH management).
5. **Real-Time Telemetry & Forensic Audit:** Structured event streaming over WebSockets (with HTTP polling fallback) and persistent simulation run logging in SQLite.

---

## 2. Component Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React 18 + Vite)                       │
│  - Soft Coastal Pastel Design System                                   │
│  - React Flow Interactive Topology Canvas                             │
│  - Recharts Telemetry Visualizations                                  │
│  - Scenario Runner & Forensic Audit Console                           │
└───────────────────┬─────────────────────────────────▲──────────────────┘
                    │ REST API                        │ WebSocket
                    │ HTTP/1.1 (/api/v1)              │ /ws/network-events
                    ▼                                 │
┌─────────────────────────────────────────────────────┴──────────────────┐
│                        Backend (FastAPI + Python 3.9+)                 │
│  ┌───────────────────────┬───────────────────────┬───────────────────┐ │
│  │   Routing Engine      │     QoS Engine        │  Security Engine  │ │
│  │ (Dijkstra Shortest    │ (Priority Queueing &  │ (ACL Evaluator,   │ │
│  │  Path & Convergence)  │  Congestion Modeling) │  DHCP, Port Sec)  │ │
│  └───────────────────────┴───────────────────────┴───────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │             Simulation Service & Event Dispatcher                 │ │
│  │  - Genuine state-changing failure & restoration                   │ │
│  │  - Measured wall-clock & modeled convergence metrics              │ │
│  │  - Baseline restoration (without erasing historical records)      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy 2.x
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Persistence Layer (SQLite)                       │
│  - network_nodes (including device_id)                                 │
│  - network_links (bidirectional pairs with cost, bandwidth, latency)   │
│  - departments (7 subnets, gateways, VLAN IDs)                        │
│  - scenarios & simulation_runs (complete initial & final snapshots)    │
│  - network_events & alerts (persisted across restarts)                 │
│  - access_rules (ordered permit/deny firewall policies)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Network Topology & IP Addressing Plan

The simulated network models 4 core routers arranged in a ring with cross-links, interconnecting 7 emergency response departments:

### 3.1 Department Subnets and Gateways

| Department | Department Code | Subnet | Gateway | VLAN ID | Priority | Connected Switch | Uplink Router |
|---|---|---|---|---|---|---|---|
| **Emergency Control Center** | `ECC` | `192.168.10.0/24` | `192.168.10.1` | 10 | 1 (Critical) | `SW-ECC` | `R1` |
| **Police** | `POLICE` | `192.168.20.0/24` | `192.168.20.1` | 20 | 2 (High) | `SW-POLICE` | `R2` |
| **Fire Department** | `FIRE` | `192.168.30.0/24` | `192.168.30.1` | 30 | 2 (High) | `SW-FIRE` | `R2` |
| **Hospital** | `HOSPITAL` | `192.168.40.0/24` | `192.168.40.1` | 40 | 1 (Critical) | `SW-HOSPITAL` | `R3` |
| **Ambulance Services** | `AMBULANCE` | `192.168.50.0/24` | `192.168.50.1` | 50 | 1 (Critical) | `SW-AMBULANCE` | `R3` |
| **Relief Camp** | `RELIEF` | `192.168.60.0/24` | `192.168.60.1` | 60 | 3 (Normal) | `SW-RELIEF` | `R4` |
| **Backup Control Center** | `BACKUP` | `192.168.70.0/24` | `192.168.70.1` | 70 | 1 (Critical) | `SW-BACKUP` | `R4` |

### 3.2 Core Router Backbone

- **R1 (North):** `10.0.0.1`
- **R2 (East):** `10.0.0.2`
- **R3 (South):** `10.0.0.3`
- **R4 (West):** `10.0.0.4`
- **Core Ring Links:** `R1-R2` (cost 10), `R2-R3` (cost 10), `R3-R4` (cost 10), `R4-R1` (cost 10).
- **Mesh Redundancy Diagonals:** `R1-R3` (cost 15), `R2-R4` (cost 15).
- **Secondary Inter-Switch Link:** `SW-HOSPITAL ↔ SW-AMBULANCE` (cost 8, provides localized hospital bypass).

---

## 4. Routing Engine Specification

- **Algorithm:** Dijkstra's shortest-path algorithm evaluated over positive, configurable integer link costs.
- **Failover Behavior:** When a link or node transitions to `down` or `failed`, the engine excludes unavailable graph edges and recalculates the alternate path.
- **Accuracy Note:** The algorithm models link-state path determination (inspired by OSPF principles). Actual physical OSPF hello packets and router adjacencies are simulated in software.

---

## 5. QoS Scheduler Specification

Traffic is categorized into 4 priority queues:
1. **Critical:** Ambulance dispatch and hospital patient telemetry.
2. **High:** Police tactical command and fire rescue dispatch.
3. **Normal:** Inter-departmental logistics and routine updates.
4. **Low:** Administrative log synchronization and background traffic.

### Scheduling Logic
- When `offered_load <= bottleneck_bandwidth` (uncongested, $\le 1000\text{ Mbps}$), all classes experience $100\%$ packet delivery and minimal queue delay ($\approx 0.5 - 2\text{ ms}$).
- When `offered_load > bottleneck_bandwidth` (congested), the scheduler prioritizes the Critical queue with near-$100\%$ delivery ($>98\%$), while queuing and intentionally dropping Low and Normal priority packets.

---

## 6. Access Control & Security

- **ACL Evaluator:** Inspects inbound packets sequentially by `rule_order`. Rules define `PERMIT` or `DENY` actions based on source department, destination department, destination IP prefix, and protocol. Denied packets are logged to the `network_events` and `alerts` tables.
- **DHCP Emulation:** Generates valid IP allocations from designated departmental VLAN pools.
- **Port Security Emulation:** Evaluates device MAC addresses against authorized vendor prefixes, triggering simulated `ERR_DISABLE` port shutdown for rogue devices.
- **SSH VTY Emulation:** Restricts remote administrative CLI access to authorized administrators operating from command subnets (VLAN 10 and VLAN 70).

---

## 7. Development Team Details

- **Aahaan Kothari** — 24BDS0273
- **Sara Choudhary** — 24BCT0219
- **Aryan Verma** — 24BCT0223
