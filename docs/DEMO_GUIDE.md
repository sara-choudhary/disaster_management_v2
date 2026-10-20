# Viva & College Demonstration Guide — Disaster-Resistant Emergency Communication Network

This guide details the recommended walkthrough sequence for presenting this project during a college evaluation, capstone defense, or technical viva.

---

## 1. Project Team Details

- **Aahaan Kothari** — 24BDS0273
- **Sara Choudhary** — 24BCT0219
- **Aryan Verma** — 24BCT0223

---

## 2. Recommended Demonstration Order

Follow this step-by-step walkthrough during your live demonstration:

### Step 1: Landing Page (`/`)
1. Open `http://localhost:5173/` in your browser.
2. Highlight:
   - The complete project title: **Disaster-Resistant Emergency Communication Network with Priority Routing**.
   - The subtle shield watermark background and coastal pastel design system.
   - The concise architectural problem statement.
3. Click the rectangular **Explore Dashboard** button to enter the main system.

---

### Step 2: Overview Dashboard (`/dashboard`)
1. Review the top telemetry cards:
   - **Network Availability:** 100% (7/7 Departments reachable).
   - **Active Links:** 34/34 directional links operational.
   - **Open Critical Alerts:** 0 in baseline state.
2. Demonstrate **OSPF-Inspired Selected Route Inspection**:
   - Select **Source:** `Emergency Control Center`
   - Select **Destination:** `Police`
   - Observe the computed shortest path: `SW-ECC ➔ R1 ➔ R2 ➔ SW-POLICE` (Total metric cost: 25).
3. Click **Simulate Primary Link Failure**:
   - Link `L-R1-R2` will be severed.
   - The route dynamically recalculates through the alternate ring path (`R1 ➔ R4 ➔ R2` or `R1 ➔ R3 ➔ R2`).
   - Notice the measured Dijkstra convergence time and the new alert logged.
4. Click **Restore Network** to return the topology to normal baseline.

---

### Step 3: Interactive Topology Canvas (`/topology`)
1. Navigate to `/topology` via the sidebar (press the hamburger menu in the header).
2. Showcase the React Flow canvas:
   - Use Zoom, Pan, and Fit-to-View controls.
   - Identify the 4 Core Routers (`R1`, `R2`, `R3`, `R4`), Department Switches, and Endpoints.
3. Click on **Core Router 1 (`R1`)**:
   - Inspect its IP (`10.0.0.1`), status, and metadata in the right-hand Inspector drawer.
   - Click **Simulate Device Failure** $\rightarrow$ Observe `R1` turn dusty rose (`#CC858D`), and all connected links switch to dashed red lines.
   - Click **Restore Device** $\rightarrow$ Watch the router recover and link states return to cerulean.
4. Click on any link $\rightarrow$ View bandwidth, latency, and metric cost, and trigger a simulated cut.

---

### Step 4: Scenario Runner (`/scenarios`)
1. Navigate to `/scenarios`.
2. Present the 6 predefined disaster scenarios:
   - **Scenario 1:** Primary Link Failure (R1 <-> R2 Outage)
   - **Scenario 2:** Main Router Outage (Core Router 1 Offline)
   - **Scenario 3:** Main Control Center Outage (ECC Isolated; failover to Backup Command)
   - **Scenario 4:** Hospital Connectivity Failure (Hospital primary link severed; reroutes via Ambulance switch bypass)
   - **Scenario 5:** High Traffic Congestion & Priority Scheduling
   - **Scenario 6:** Unauthorized Access Attempt (ACL Violation)
3. Select **Scenario 1** and click **Run Scenario**:
   - Observe real-time execution.
   - Review the generated **Run ID**, measured execution duration (ms), dynamic route changes table, and outcome (`SUCCESS`).
4. Click **Reset Baseline** to ensure clean state for the next test.

---

### Step 5: Traffic Priority & QoS Scheduler (`/traffic`)
1. Navigate to `/traffic`.
2. Explain the fundamental difference between routing and QoS:
   - *Routing selects the path; QoS controls which packets get scheduled during congestion.*
3. Set parameters:
   - **Source:** `Emergency Control Center`
   - **Destination:** `Hospital`
   - **Offered Transit Load:** `1500 Mbps` (Exceeds the 1,000 Mbps bottleneck bandwidth).
4. Click **Simulate QoS Traffic Flow**:
   - Inspect the Recharts Bar Chart:
     - **Critical Class (Ambulance/Hospital):** Near 100% delivery ratio ($>98\%$), low queue delay.
     - **Low Class (Administrative Logs):** Absorbs high packet drops ($<50\%$ delivery) and higher queue latency.
   - Verify that **Packets Sent = Packets Delivered + Packets Lost** holds strictly true.

---

### Step 6: Alerts & Departmental Access Control (`/alerts`)
1. Navigate to `/alerts`.
2. Tab 1 (**Active Alerts**): Review generated alerts and demonstrate acknowledging or resolving an open alert.
3. Tab 2 (**Departmental ACL Firewall**):
   - Review ordered rules: Rule 50 blocks Relief Camp from directly accessing ECC Core Command Server (`192.168.10.50`).
   - Test connection: Source = `Relief Camp`, Destination = `Emergency Control Center`, IP = `192.168.10.50`.
   - Click **Test Rule** $\rightarrow$ Verify traffic is blocked (`DENY`) and a security violation is persisted.
4. Tab 3 (**Educational Demonstrations**):
   - **DHCP:** Request lease on `Hospital` $\rightarrow$ Receive allocated IP `192.168.40.xxx` on VLAN 40.
   - **Port Security:** Test with authorized MAC `00:50:56:AA:BB:CC` (`FORWARDING`), then test with rogue MAC `DE:AD:BE:EF:00:99` (`ERR_DISABLE` port shutdown).
   - **SSH:** Test with admin user from `192.168.10.15` (Allowed), then from guest user on `192.168.60.25` (Denied).

---

### Step 7: Reports & Data Exports (`/reports`)
1. Navigate to `/reports`.
2. Inspect the historical list of completed simulation runs.
3. Click **Inspect** on any run to view the full dossier with linked forensic events.
4. Click **Export CSV** and **Export JSON**:
   - Verify that downloaded files contain genuine persisted records, accurate timestamps, and complete packet statistics.

---

## 3. Key Viva Defense Talking Points

When questioned by examiners:
- **How is OSPF simulated?** We model link-state topology in an adjacency graph with positive metric costs. Dijkstra's shortest-path algorithm is executed to find the lowest-cost path and recalculates upon link/node failure events.
- **Why SQLite?** SQLite provides zero-configuration, ACID-compliant relational persistence without requiring external database servers or cloud dependencies, ideal for reproducible local demonstrations.
- **How does QoS maintain fairness?** While Critical traffic receives strict priority with guaranteed bandwidth, starvation safeguards ensure lower queues are processed when higher queues are empty.
- **Is this running real Cisco hardware?** No, this is an educational full-stack software simulation that models networking concepts accurately according to RFC principles.
