# Disaster-Resistant Emergency Communication Network with Priority Routing

An academic, resume-quality full-stack networking simulation platform that demonstrates how emergency municipal departments maintain mission-critical communications during natural disasters and infrastructure outages through redundant ring topology, alternate-path routing, priority traffic scheduling (QoS), failure recovery simulation, and departmental access control.

---

## Team Members

- **Aahaan Kothari** — 24BDS0273
- **Sara Choudhary** — 24BCT0219
- **Aryan Verma** — 24BCT0223

---

## 1. Project Abstract

In high-consequence disasters (earthquakes, flash floods, cyber disruptions), public telecommunications infrastructure frequently suffers catastrophic physical cuts and severe traffic congestion. Standard municipal networks lack localized alternate-path routing and granular quality of service (QoS), leading to delayed ambulance dispatch, lost medical telemetry, and uncoordinated disaster relief.

This project delivers a disaster-resistant emergency response communication network featuring a 4-core router backbone arranged in a resilient ring topology with cross-mesh links connecting 7 municipal emergency departments. Built on FastAPI, SQLite, React, and TypeScript, it models link-state shortest-path routing (inspired by OSPF), strict priority queueing, genuine failure injection and recovery, and departmental firewall ACL policies.

---

## 2. Problem Statement & Objectives

### Problem Statement
Emergency response coordination requires guaranteed connectivity between municipal command centers, hospitals, fire brigades, and police stations. When primary fiber links are severed or networks become severely congested, critical life-safety packets (e.g. ICU telemetry, ambulance dispatches) compete equally with administrative background traffic, causing critical communication blackouts.

### Objectives
1. **Redundant Topology:** Model 4 core routers and 7 departmental IPv4 subnets across isolated VLANs.
2. **Dynamic Failover:** Implement Dijkstra's algorithm to compute shortest paths and dynamically converge on alternate paths upon link/node failure.
3. **Traffic Prioritization (QoS):** Implement a 4-tier priority scheduler (Critical, High, Normal, Low) that guarantees preferential delivery for life-safety packets under heavy congestion.
4. **Access Control & Security:** Enforce departmental access control lists (ACLs) and demonstrate educational network security concepts (DHCP, Switch Port Security, and SSH VTY administration).
5. **Full Auditability:** Persist simulation history, measured recovery times, and forensic events in a local relational database with CSV/JSON export capabilities.

---

## 3. System Architecture

The project is structured as a clean, decoupled monorepo:

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (Soft Coastal Pastel visual theme), React Flow for topology visualization, and Recharts for telemetry analytics.
- **Backend:** Python 3.9+, FastAPI, Pydantic v2, SQLAlchemy 2.x, SQLite, and Uvicorn.
- **Event Streaming:** WebSocket endpoint (`/ws/network-events`) with automatic bounded exponential backoff reconnect and HTTP polling fallback.

---

## 4. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with centralized coastal pastel design tokens
- **Topology Canvas:** React Flow (`reactflow`)
- **Telemetry Charts:** Recharts
- **Icons:** Lucide React
- **Testing:** Vitest + React Testing Library + JSDOM

### Backend
- **Framework:** FastAPI
- **Web Server:** Uvicorn
- **Validation:** Pydantic v2
- **ORM:** SQLAlchemy 2.x
- **Database:** SQLite (local zero-configuration relational store)
- **Testing:** pytest + HTTPX

---

## 5. Folder Structure

```text
disaster_management_v2/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Environment configuration & CORS
│   │   ├── database.py            # SQLite engine, sessions, foreign key pragma
│   │   ├── models.py              # SQLAlchemy 2.x entities
│   │   ├── schemas.py             # Pydantic v2 validation models
│   │   ├── seed_data.py           # Idempotent database seeder
│   │   ├── main.py                # FastAPI entry point & WebSocket handler
│   │   ├── routers/
│   │   │   ├── network.py         # Topology, nodes, links, routes, failure injection
│   │   │   ├── simulations.py     # Scenario definitions & run execution
│   │   │   ├── traffic.py         # QoS priority queue traffic simulation
│   │   │   ├── security.py        # ACL rules, DHCP, Port Security, SSH
│   │   │   ├── events_alerts.py   # Event timeline & alert management
│   │   │   └── reports.py         # Summary analytics, CSV & JSON exports
│   │   └── services/
│   │       ├── routing.py         # Dijkstra shortest-path engine
│   │       ├── qos.py             # Priority queue scheduler & congestion model
│   │       ├── security.py        # ACL evaluator & educational security
│   │       ├── simulation.py      # State-changing failure/recovery service
│   │       └── websocket.py       # WebSocket connection manager
│   ├── tests/
│   │   ├── conftest.py            # Isolated test database fixture
│   │   └── test_backend.py        # Pytest test suite (8 tests)
│   ├── requirements.txt           # Python backend dependencies
│   └── venv/                      # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/layout/
│   │   │   ├── Header.tsx         # Hamburger menu, sync indicator, baseline reset
│   │   │   ├── Sidebar.tsx        # Responsive navigation drawer
│   │   │   └── AppLayout.tsx      # Main application layout wrapper
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts    # Reconnecting WebSocket with polling fallback
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx    # Academic landing page with shield watermark
│   │   │   ├── DashboardPage.tsx  # Overview metrics, route query, quick actions
│   │   │   ├── TopologyPage.tsx   # Interactive React Flow topology & inspector
│   │   │   ├── ScenariosPage.tsx  # 6 disaster scenarios runner
│   │   │   ├── TrafficQoSPage.tsx # QoS controls & Recharts priority queues
│   │   │   ├── TelemetryPage.tsx  # Recovery duration & packet delivery charts
│   │   │   ├── AlertsSecurityPage.tsx # Alerts, ACL tester, DHCP, Port Sec, SSH
│   │   │   └── ReportsPage.tsx    # Searchable run history, CSV/JSON exports
│   │   ├── services/
│   │   │   └── api.ts             # Typed REST API client
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript interfaces
│   │   ├── test/
│   │   │   ├── setup.ts           # Vitest setup & DOM mocks
│   │   │   └── App.test.tsx       # Vitest + RTL frontend tests (4 tests)
│   │   ├── App.tsx                # React Router setup
│   │   ├── main.tsx               # DOM root
│   │   └── index.css              # Tailwind base & coastal design tokens
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docs/
│   ├── ARCHITECTURE.md            # Detailed technical specification
│   └── DEMO_GUIDE.md              # Viva presentation step-by-step script
├── .env.example
├── .gitignore
└── README.md
```

---

## 6. Network Topology & IP Plan

| Department | Subnet | Gateway | VLAN | Role |
|---|---|---|---|---|
| **Emergency Control Center** | `192.168.10.0/24` | `192.168.10.1` | 10 | Primary Command & Dispatch |
| **Police HQ** | `192.168.20.0/24` | `192.168.20.1` | 20 | Law Enforcement & Perimeter Security |
| **Fire Department** | `192.168.30.0/24` | `192.168.30.1` | 30 | Fire & Search/Rescue |
| **Hospital Complex** | `192.168.40.0/24` | `192.168.40.1` | 40 | Trauma Center & ICU Telemetry |
| **Ambulance Services** | `192.168.50.0/24` | `192.168.50.1` | 50 | Field Paramedic Fleet |
| **Relief Camp** | `192.168.60.0/24` | `192.168.60.1` | 60 | Civilian Shelter & Supplies |
| **Backup Control Center** | `192.168.70.0/24` | `192.168.70.1` | 70 | Disaster Recovery Secondary Command |

---

## 7. Setup & Execution Instructions

### Prerequisites
- Python 3.9+ installed (`python3 --version`)
- Node.js 18+ and npm installed (`node --version`, `npm --version`)

### Quick Setup

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows PowerShell: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend server (runs on port 8000)
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API Documentation will be live at: `http://localhost:8000/docs`

#### 2. Frontend Setup
In a separate terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 5173)
npm run dev
```

Frontend Application will be live at: `http://localhost:5173/`

---

## 8. Automated Test Commands

### Run Backend Tests
```bash
# From repository root
PYTHONPATH=backend backend/venv/bin/pytest backend/tests -v
```
*Result: 8 passing tests covering schema, Dijkstra routing, failover, QoS priority scheduling, ACL policies, and educational security features.*

### Run Frontend Tests
```bash
# From frontend directory
cd frontend
npm test
```
*Result: 4 passing Vitest tests covering landing page rendering, Explore Dashboard button, and responsive navigation.*

### Build Frontend for Production
```bash
cd frontend
npm run build
```
*Result: Clean TypeScript compilation and Vite production bundle generated in `frontend/dist/`.*

---

## 9. Educational Simulation Disclaimer

This project is an **academic educational software simulation**. It calculates link-state paths using Dijkstra's algorithm (inspired by OSPF principles), schedules packets across priority queues, and models access control policies in Python and TypeScript. It is **not** a controller for physical Cisco, Juniper, or commercial networking hardware. Recovery and latency values represent software-modeled estimates rather than physical hardware link measurements.
