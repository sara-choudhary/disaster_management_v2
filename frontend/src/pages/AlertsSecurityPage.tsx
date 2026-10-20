import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Terminal,
  Server,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api';
import { Alert, AccessRule, NetworkEvent } from '../types';

export const AlertsSecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'acl' | 'educational' | 'forensics'>('alerts');

  // Alerts State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  // ACL State
  const [rules, setRules] = useState<AccessRule[]>([]);
  const [testSrcDept, setTestSrcDept] = useState<string>('Relief Camp');
  const [testDstDept, setTestDstDept] = useState<string>('Emergency Control Center');
  const [testSrcIp, setTestSrcIp] = useState<string>('192.168.60.10');
  const [testDstIp, setTestDstIp] = useState<string>('192.168.10.50');
  const [testProtocol, setTestProtocol] = useState<string>('TCP');
  const [testPort, setTestPort] = useState<number>(5432);
  const [aclTestResult, setAclTestResult] = useState<any | null>(null);

  // Educational State
  const [, setDhcpPools] = useState<any[]>([]);
  const [dhcpDept, setDhcpDept] = useState<string>('Hospital');
  const [dhcpMac, setDhcpMac] = useState<string>('00:50:56:4A:2B:1C');
  const [dhcpResult, setDhcpResult] = useState<any | null>(null);

  const [portSwitch, setPortSwitch] = useState<string>('SW-ECC');
  const [portMac, setPortMac] = useState<string>('00:50:56:AA:BB:CC');
  const [portResult, setPortResult] = useState<any | null>(null);

  const [sshTarget, setSshTarget] = useState<string>('R1');
  const [sshUser, setSshUser] = useState<string>('admin');
  const [sshIp, setSshIp] = useState<string>('192.168.10.15');
  const [sshResult, setSshResult] = useState<any | null>(null);

  // Forensics State
  const [events, setEvents] = useState<NetworkEvent[]>([]);

  // Load Data
  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const loadAclRules = async () => {
    try {
      const data = await api.getAccessRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load access rules:', err);
    }
  };

  const loadEducational = async () => {
    try {
      const pools = await api.getDhcpPools();
      setDhcpPools(pools);
    } catch (err) {
      console.error('Failed to load DHCP pools:', err);
    }
  };

  const loadEvents = async () => {
    try {
      const evs = await api.getEvents({ limit: 50 });
      setEvents(evs);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'alerts') loadAlerts();
    if (activeTab === 'acl') loadAclRules();
    if (activeTab === 'educational') loadEducational();
    if (activeTab === 'forensics') loadEvents();
  }, [activeTab, statusFilter, severityFilter]);

  // Alert Actions
  const handleUpdateAlert = async (alertId: string, newStatus: 'acknowledged' | 'resolved') => {
    try {
      await api.updateAlertStatus(alertId, newStatus);
      loadAlerts();
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  // ACL Test
  const handleRunAclTest = async () => {
    try {
      const res = await api.testAccess({
        source_department: testSrcDept,
        destination_department: testDstDept,
        source_ip: testSrcIp,
        destination_ip: testDstIp,
        protocol: testProtocol,
        port: testPort,
      });
      setAclTestResult(res);
      loadAclRules();
    } catch (err) {
      console.error('Failed to test access:', err);
    }
  };

  // Educational Tests
  const handleDhcpAllocate = async () => {
    try {
      const res = await api.allocateDhcp({
        department: dhcpDept,
        client_hostname: 'demo-client',
        client_mac: dhcpMac,
      });
      setDhcpResult(res);
    } catch (err) {
      console.error('Failed to allocate DHCP:', err);
    }
  };

  const handleTestPortSecurity = async () => {
    try {
      const res = await api.testPortSecurity({
        switch_id: portSwitch,
        port_number: 1,
        mac_address: portMac,
      });
      setPortResult(res);
    } catch (err) {
      console.error('Failed port security test:', err);
    }
  };

  const handleTestSsh = async () => {
    try {
      const res = await api.testSsh({
        target_device: sshTarget,
        username: sshUser,
        source_ip: sshIp,
      });
      setSshResult(res);
    } catch (err) {
      console.error('Failed SSH test:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-coastal-border text-xs font-semibold gap-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'alerts'
              ? 'border-coastal-cerulean text-coastal-cerulean'
              : 'border-transparent text-coastal-secondary hover:text-coastal-text'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Active Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('acl')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'acl'
              ? 'border-coastal-cerulean text-coastal-cerulean'
              : 'border-transparent text-coastal-secondary hover:text-coastal-text'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Departmental ACL Firewall</span>
        </button>

        <button
          onClick={() => setActiveTab('educational')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'educational'
              ? 'border-coastal-cerulean text-coastal-cerulean'
              : 'border-transparent text-coastal-secondary hover:text-coastal-text'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Educational Demonstrations (DHCP / PortSec / SSH)</span>
        </button>

        <button
          onClick={() => setActiveTab('forensics')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'forensics'
              ? 'border-coastal-cerulean text-coastal-cerulean'
              : 'border-transparent text-coastal-secondary hover:text-coastal-text'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Forensic Event Timeline</span>
        </button>
      </div>

      {/* TAB 1: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3.5 rounded bg-coastal-cream border border-coastal-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-coastal-secondary font-medium">Filter By:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 rounded border border-coastal-border bg-white text-coastal-text"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1 rounded border border-coastal-border bg-white text-coastal-text"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="suspicious">Suspicious</option>
              </select>
            </div>

            <span className="text-coastal-secondary">
              Total Alerts: <strong>{alerts.length}</strong>
            </span>
          </div>

          {/* Alerts Table */}
          <div className="bg-white rounded border border-coastal-border overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-coastal-cream/70 border-b border-coastal-border text-coastal-secondary uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Alert ID</th>
                  <th className="py-2.5 px-4">Time (UTC)</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Affected Resource</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coastal-border/60">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-coastal-secondary">
                      No matching alerts found.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.alert_id} className="hover:bg-coastal-cream/30">
                      <td className="py-2.5 px-4 font-mono font-semibold text-coastal-text">
                        {a.alert_id}
                      </td>
                      <td className="py-2.5 px-4 text-coastal-secondary">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            a.severity === 'critical'
                              ? 'bg-coastal-critical/20 text-coastal-critical'
                              : a.severity === 'warning'
                              ? 'bg-coastal-warning/30 text-amber-900'
                              : 'bg-coastal-suspicious/20 text-orange-900'
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 uppercase text-coastal-secondary font-medium">
                        {a.category}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-coastal-text">
                        {a.affected_resource}
                      </td>
                      <td className="py-2.5 px-4 text-coastal-secondary max-w-xs truncate">
                        {a.description}
                      </td>
                      <td className="py-2.5 px-4 font-semibold capitalize">
                        {a.status}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {a.status === 'open' && (
                            <button
                              onClick={() => handleUpdateAlert(a.alert_id, 'acknowledged')}
                              className="px-2 py-0.5 rounded bg-white border border-coastal-border hover:bg-coastal-powder/60 text-coastal-text"
                            >
                              Ack
                            </button>
                          )}
                          {a.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateAlert(a.alert_id, 'resolved')}
                              className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS CONTROL (ACL) */}
      {activeTab === 'acl' && (
        <div className="space-y-6">
          {/* ACL Connection Tester Box */}
          <div className="p-5 rounded bg-coastal-cream border border-coastal-border space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-coastal-text flex items-center gap-2">
              <Lock className="w-4 h-4 text-coastal-cerulean" />
              <span>Inter-Departmental Access Control (ACL) Policy Evaluator</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-coastal-secondary mb-1">Source Dept</label>
                <select
                  value={testSrcDept}
                  onChange={(e) => setTestSrcDept(e.target.value)}
                  className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text"
                >
                  <option value="Relief Camp">Relief Camp</option>
                  <option value="Emergency Control Center">Emergency Control Center</option>
                  <option value="Police">Police</option>
                  <option value="Fire Department">Fire Department</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Ambulance Services">Ambulance Services</option>
                  <option value="Backup Control Center">Backup Control Center</option>
                </select>
              </div>

              <div>
                <label className="block text-coastal-secondary mb-1">Destination Dept</label>
                <select
                  value={testDstDept}
                  onChange={(e) => setTestDstDept(e.target.value)}
                  className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text"
                >
                  <option value="Emergency Control Center">Emergency Control Center</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Ambulance Services">Ambulance Services</option>
                  <option value="Police">Police</option>
                  <option value="Fire Department">Fire Department</option>
                  <option value="Relief Camp">Relief Camp</option>
                  <option value="Backup Control Center">Backup Control Center</option>
                </select>
              </div>

              <div>
                <label className="block text-coastal-secondary mb-1">Source IP</label>
                <input
                  type="text"
                  value={testSrcIp}
                  onChange={(e) => setTestSrcIp(e.target.value)}
                  className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text font-mono"
                />
              </div>

              <div>
                <label className="block text-coastal-secondary mb-1">Destination IP</label>
                <input
                  type="text"
                  value={testDstIp}
                  onChange={(e) => setTestDstIp(e.target.value)}
                  className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text font-mono"
                />
              </div>

              <div>
                <label className="block text-coastal-secondary mb-1">Protocol / Port</label>
                <div className="flex gap-1">
                  <select
                    value={testProtocol}
                    onChange={(e) => setTestProtocol(e.target.value)}
                    className="w-20 p-2 rounded border border-coastal-border bg-white text-coastal-text"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                  </select>
                  <input
                    type="number"
                    value={testPort}
                    onChange={(e) => setTestPort(Number(e.target.value))}
                    className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text font-mono"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunAclTest}
                  className="w-full py-2 bg-coastal-cerulean text-white font-semibold rounded hover:bg-coastal-cerulean/90 shadow-xs"
                >
                  Test Rule
                </button>
              </div>
            </div>

            {/* Test Result Feedback */}
            {aclTestResult && (
              <div
                className={`p-3.5 rounded border text-xs flex items-center justify-between ${
                  aclTestResult.allowed
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-coastal-rose/20 border-coastal-rose/40 text-coastal-text'
                }`}
              >
                <div>
                  <span className="font-bold uppercase tracking-wider">
                    {aclTestResult.action}: {aclTestResult.allowed ? 'Traffic Allowed' : 'Traffic Blocked'}
                  </span>
                  <p className="mt-0.5 text-coastal-secondary">{aclTestResult.reason}</p>
                </div>
                {aclTestResult.security_event_logged && (
                  <span className="text-[10px] font-semibold uppercase bg-coastal-rose text-white px-2 py-0.5 rounded">
                    Security Violation Persisted
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Active ACL Rules Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-coastal-text">
              Active Ordered ACL Rule Base
            </h3>
            <div className="bg-white rounded border border-coastal-border overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-coastal-cream/70 border-b border-coastal-border text-coastal-secondary uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Order</th>
                    <th className="py-2.5 px-4">Rule ID</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Source Dept</th>
                    <th className="py-2.5 px-4">Destination Dept</th>
                    <th className="py-2.5 px-4">Destination Subnet</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coastal-border/60">
                  {rules.map((r) => (
                    <tr key={r.rule_id} className="hover:bg-coastal-cream/30">
                      <td className="py-2.5 px-4 font-mono font-semibold">{r.rule_order}</td>
                      <td className="py-2.5 px-4 font-mono text-coastal-cerulean font-semibold">{r.rule_id}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.action === 'PERMIT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-coastal-rose/20 text-coastal-rose'
                          }`}
                        >
                          {r.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-coastal-text">{r.source_department}</td>
                      <td className="py-2.5 px-4 text-coastal-text">{r.destination_department}</td>
                      <td className="py-2.5 px-4 font-mono text-coastal-secondary">{r.destination_ip}</td>
                      <td className="py-2.5 px-4 text-coastal-secondary max-w-sm truncate">{r.description}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-emerald-700 font-semibold text-[11px]">Enabled</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EDUCATIONAL DEMONSTRATIONS */}
      {activeTab === 'educational' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Demo 1: DHCP */}
            <div className="p-5 rounded bg-coastal-cream border border-coastal-border space-y-4 shadow-xs">
              <div className="border-b border-coastal-border pb-2">
                <h4 className="text-sm font-semibold text-coastal-text flex items-center gap-2">
                  <Server className="w-4 h-4 text-coastal-cerulean" />
                  <span>DHCP Dynamic Lease Simulator</span>
                </h4>
                <p className="text-[11px] text-coastal-secondary mt-0.5">
                  Simulate dynamic IP allocation across departmental VLANs.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-coastal-secondary mb-1">Target Department</label>
                  <select
                    value={dhcpDept}
                    onChange={(e) => setDhcpDept(e.target.value)}
                    className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text"
                  >
                    <option value="Hospital">Hospital (VLAN 40)</option>
                    <option value="Police">Police (VLAN 20)</option>
                    <option value="Fire Department">Fire Department (VLAN 30)</option>
                    <option value="Ambulance Services">Ambulance Services (VLAN 50)</option>
                    <option value="Relief Camp">Relief Camp (VLAN 60)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-coastal-secondary mb-1">Client MAC Address</label>
                  <input
                    type="text"
                    value={dhcpMac}
                    onChange={(e) => setDhcpMac(e.target.value)}
                    className="w-full p-2 rounded border border-coastal-border bg-white font-mono"
                  />
                </div>

                <button
                  onClick={handleDhcpAllocate}
                  className="w-full py-2 bg-coastal-cerulean text-white font-semibold rounded hover:bg-coastal-cerulean/90 shadow-xs"
                >
                  Request DHCP Lease
                </button>

                {dhcpResult && (
                  <div className="p-3 rounded bg-white border border-coastal-border space-y-1 text-[11px]">
                    <div className="font-semibold text-emerald-800">{dhcpResult.message}</div>
                    <div>Allocated IP: <strong className="font-mono">{dhcpResult.allocated_ip}</strong></div>
                    <div>Gateway: <span className="font-mono">{dhcpResult.gateway}</span></div>
                    <div>DNS: <span>{dhcpResult.dns}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* Demo 2: Switch Port Security */}
            <div className="p-5 rounded bg-coastal-cream border border-coastal-border space-y-4 shadow-xs">
              <div className="border-b border-coastal-border pb-2">
                <h4 className="text-sm font-semibold text-coastal-text flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-coastal-rose" />
                  <span>Switch Port Security (MAC Filter)</span>
                </h4>
                <p className="text-[11px] text-coastal-secondary mt-0.5">
                  Test authorized vs rogue MAC access and err-disable port shutdown.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-coastal-secondary mb-1">Switch Device</label>
                  <select
                    value={portSwitch}
                    onChange={(e) => setPortSwitch(e.target.value)}
                    className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text"
                  >
                    <option value="SW-ECC">SW-ECC (Emergency Control Switch)</option>
                    <option value="SW-HOSPITAL">SW-HOSPITAL (Hospital Complex Switch)</option>
                    <option value="SW-POLICE">SW-POLICE (Police HQ Switch)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-coastal-secondary mb-1">Device MAC Address</label>
                  <input
                    type="text"
                    value={portMac}
                    onChange={(e) => setPortMac(e.target.value)}
                    className="w-full p-2 rounded border border-coastal-border bg-white font-mono"
                  />
                  <div className="flex gap-2 mt-1 text-[10px] text-coastal-secondary">
                    <button
                      onClick={() => setPortMac('00:50:56:AA:BB:CC')}
                      className="text-coastal-cerulean underline"
                    >
                      Use Authorized
                    </button>
                    <span>|</span>
                    <button
                      onClick={() => setPortMac('DE:AD:BE:EF:00:99')}
                      className="text-coastal-rose underline"
                    >
                      Use Rogue MAC
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleTestPortSecurity}
                  className="w-full py-2 bg-coastal-cerulean text-white font-semibold rounded hover:bg-coastal-cerulean/90 shadow-xs"
                >
                  Verify Port Security
                </button>

                {portResult && (
                  <div
                    className={`p-3 rounded border text-[11px] space-y-1 ${
                      portResult.allowed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-coastal-rose/20 border-coastal-rose/40 text-coastal-text'
                    }`}
                  >
                    <div className="font-bold">{portResult.action_taken}</div>
                    <p>{portResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Demo 3: SSH Access Control */}
            <div className="p-5 rounded bg-coastal-cream border border-coastal-border space-y-4 shadow-xs">
              <div className="border-b border-coastal-border pb-2">
                <h4 className="text-sm font-semibold text-coastal-text flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-coastal-mauve" />
                  <span>SSH Remote Management VTY</span>
                </h4>
                <p className="text-[11px] text-coastal-secondary mt-0.5">
                  Test administrative access restrictions by subnet & credentials.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-coastal-secondary mb-1">Target Router</label>
                  <select
                    value={sshTarget}
                    onChange={(e) => setSshTarget(e.target.value)}
                    className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text"
                  >
                    <option value="R1">Core Router 1 (R1)</option>
                    <option value="R2">Core Router 2 (R2)</option>
                    <option value="R3">Core Router 3 (R3)</option>
                    <option value="R4">Core Router 4 (R4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-coastal-secondary mb-1">Username</label>
                  <input
                    type="text"
                    value={sshUser}
                    onChange={(e) => setSshUser(e.target.value)}
                    className="w-full p-2 rounded border border-coastal-border bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-coastal-secondary mb-1">Source IP</label>
                  <input
                    type="text"
                    value={sshIp}
                    onChange={(e) => setSshIp(e.target.value)}
                    className="w-full p-2 rounded border border-coastal-border bg-white font-mono"
                  />
                  <div className="flex gap-2 mt-1 text-[10px] text-coastal-secondary">
                    <button
                      onClick={() => {
                        setSshUser('admin');
                        setSshIp('192.168.10.15');
                      }}
                      className="text-coastal-cerulean underline"
                    >
                      Admin IP
                    </button>
                    <span>|</span>
                    <button
                      onClick={() => {
                        setSshUser('guest');
                        setSshIp('192.168.60.25');
                      }}
                      className="text-coastal-rose underline"
                    >
                      Relief Camp IP
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleTestSsh}
                  className="w-full py-2 bg-coastal-cerulean text-white font-semibold rounded hover:bg-coastal-cerulean/90 shadow-xs"
                >
                  Initiate SSH Session
                </button>

                {sshResult && (
                  <div
                    className={`p-3 rounded border text-[11px] space-y-1 ${
                      sshResult.session_allowed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-coastal-rose/20 border-coastal-rose/40 text-coastal-text'
                    }`}
                  >
                    <div className="font-bold">
                      {sshResult.session_allowed ? 'SSH Session Granted' : 'SSH Access Denied'}
                    </div>
                    <p>{sshResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FORENSIC EVENT TIMELINE */}
      {activeTab === 'forensics' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded bg-coastal-cream border border-coastal-border flex items-center justify-between text-xs text-coastal-secondary">
            <span>Persisted event records for post-disaster audit and forensics.</span>
            <button
              onClick={loadEvents}
              className="text-coastal-cerulean hover:underline font-medium"
            >
              Refresh Timeline
            </button>
          </div>

          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="py-12 text-center text-xs text-coastal-secondary">
                No forensic events logged yet.
              </p>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.event_id}
                  className="p-3.5 rounded bg-white border border-coastal-border text-xs flex items-start justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          ev.severity === 'critical'
                            ? 'bg-coastal-critical/20 text-coastal-critical'
                            : ev.severity === 'warning'
                            ? 'bg-coastal-warning/30 text-amber-900'
                            : ev.severity === 'suspicious'
                            ? 'bg-coastal-suspicious/20 text-orange-900'
                            : 'bg-coastal-powder text-coastal-cerulean'
                        }`}
                      >
                        {ev.severity}
                      </span>
                      <strong className="text-coastal-text">{ev.event_type}</strong>
                      {ev.resource_id && (
                        <span className="font-mono text-coastal-secondary text-[11px]">
                          [{ev.resource_id}]
                        </span>
                      )}
                    </div>
                    <p className="text-coastal-secondary">{ev.description}</p>
                  </div>
                  <span className="text-[10px] text-coastal-secondary shrink-0 font-mono">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
