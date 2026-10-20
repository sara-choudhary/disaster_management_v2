import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Sliders, Info } from 'lucide-react';
import { api } from '../services/api';
import { TrafficSimulationResponse } from '../types';

export const TrafficQoSPage: React.FC = () => {
  const [sourceDept, setSourceDept] = useState<string>('Emergency Control Center');
  const [destDept, setDestDept] = useState<string>('Hospital');
  const [trafficClass, setTrafficClass] = useState<string>('critical');
  const [packetCount, setPacketCount] = useState<number>(1000);
  const [offeredLoad, setOfferedLoad] = useState<number>(1200); // Mbps (congested by default to showcase QoS)
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TrafficSimulationResponse | null>(null);

  const handleSimulateTraffic = async () => {
    try {
      setLoading(true);
      const data = await api.simulateTraffic({
        source_department: sourceDept,
        destination_department: destDept,
        traffic_class: trafficClass,
        packet_count: packetCount,
        offered_load_mbps: offeredLoad,
      });
      setResult(data);
    } catch (err) {
      console.error('Failed to simulate traffic:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for Recharts
  const chartData = result?.classes.map((c) => ({
    name: c.traffic_class.toUpperCase(),
    'Delivery Ratio (%)': Math.round(c.delivery_ratio * 100),
    'Queue Delay (ms)': c.queue_delay_ms,
    'Packets Delivered': c.packets_delivered,
    'Packets Lost': c.packets_lost,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Educational Clarification Banner */}
      <div className="p-4 rounded bg-coastal-cream border border-coastal-border text-xs text-coastal-secondary flex items-start gap-3">
        <Info className="w-5 h-5 text-coastal-cerulean shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-coastal-text">
            Architectural Distinction: Routing vs. Quality of Service (QoS)
          </p>
          <p>
            Dijkstra / OSPF link-state routing determines the spatial path across
            the 4-core router topology. In contrast, the QoS Priority Queue
            Scheduler controls traffic arbitration and packet scheduling at the
            bottleneck interfaces when offered load exceeds link capacity (1,000 Mbps).
          </p>
        </div>
      </div>

      {/* Main Grid: Controls & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: QoS Simulation Controls */}
        <div className="p-6 rounded bg-coastal-cream border border-coastal-border space-y-4 shadow-xs">
          <h2 className="text-sm font-semibold text-coastal-text flex items-center gap-2">
            <Sliders className="w-4 h-4 text-coastal-cerulean" />
            <span>Traffic Generator Controls</span>
          </h2>

          <div className="space-y-3 text-xs">
            {/* Source */}
            <div>
              <label className="block text-coastal-secondary mb-1 font-medium">
                Source Department
              </label>
              <select
                value={sourceDept}
                onChange={(e) => setSourceDept(e.target.value)}
                className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text"
              >
                <option value="Emergency Control Center">Emergency Control Center</option>
                <option value="Police">Police</option>
                <option value="Fire Department">Fire Department</option>
                <option value="Hospital">Hospital</option>
                <option value="Ambulance Services">Ambulance Services</option>
                <option value="Relief Camp">Relief Camp</option>
                <option value="Backup Control Center">Backup Control Center</option>
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-coastal-secondary mb-1 font-medium">
                Destination Department
              </label>
              <select
                value={destDept}
                onChange={(e) => setDestDept(e.target.value)}
                className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text"
              >
                <option value="Hospital">Hospital</option>
                <option value="Emergency Control Center">Emergency Control Center</option>
                <option value="Police">Police</option>
                <option value="Fire Department">Fire Department</option>
                <option value="Ambulance Services">Ambulance Services</option>
                <option value="Relief Camp">Relief Camp</option>
                <option value="Backup Control Center">Backup Control Center</option>
              </select>
            </div>

            {/* Primary Focus Traffic Class */}
            <div>
              <label className="block text-coastal-secondary mb-1 font-medium">
                Targeted Traffic Class
              </label>
              <select
                value={trafficClass}
                onChange={(e) => setTrafficClass(e.target.value)}
                className="w-full p-2 rounded border border-coastal-border bg-white text-coastal-text font-medium"
              >
                <option value="critical">Critical (Priority 1: Ambulance & Hospital)</option>
                <option value="high">High (Priority 2: Police & Fire Emergency)</option>
                <option value="normal">Normal (Priority 3: General Inter-Dept)</option>
                <option value="low">Low (Priority 4: Administrative Logs)</option>
              </select>
            </div>

            {/* Total Packet Count */}
            <div>
              <div className="flex justify-between text-coastal-secondary mb-1">
                <span className="font-medium">Total Offered Packets</span>
                <strong>{packetCount}</strong>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={packetCount}
                onChange={(e) => setPacketCount(Number(e.target.value))}
                className="w-full accent-coastal-cerulean"
              />
            </div>

            {/* Offered Load Slider */}
            <div>
              <div className="flex justify-between text-coastal-secondary mb-1">
                <span className="font-medium">Offered Transit Load</span>
                <strong className={offeredLoad > 1000 ? 'text-coastal-rose font-bold' : ''}>
                  {offeredLoad} Mbps {offeredLoad > 1000 ? '(Congested)' : '(Normal)'}
                </strong>
              </div>
              <input
                type="range"
                min="200"
                max="2500"
                step="100"
                value={offeredLoad}
                onChange={(e) => setOfferedLoad(Number(e.target.value))}
                className="w-full accent-coastal-cerulean"
              />
              <p className="text-[10px] text-coastal-secondary mt-0.5">
                Path bottleneck capacity: 1,000 Mbps
              </p>
            </div>

            {/* Run Button */}
            <button
              onClick={handleSimulateTraffic}
              disabled={loading}
              className="w-full mt-4 py-2.5 bg-coastal-cerulean text-white font-semibold rounded hover:bg-coastal-cerulean/90 focus:outline-none focus:ring-2 focus:ring-coastal-cerulean/40 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Computing Priority Queues...' : 'Simulate QoS Traffic Flow'}
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Output Charts & Detailed Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <div className="p-6 rounded bg-coastal-cream border border-coastal-border space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-coastal-border pb-3">
                <div>
                  <h3 className="text-base font-semibold text-coastal-text">
                    QoS Scheduler Execution Results
                  </h3>
                  <p className="text-xs text-coastal-secondary">
                    Path: <span className="font-mono text-coastal-cerulean">{result.path_used.join(' ➔ ')}</span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    result.congestion_detected
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {result.congestion_detected ? 'Congestion Active' : 'Uncongested'}
                </span>
              </div>

              {/* Overall Packet Accounting Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded bg-white border border-coastal-border">
                  <span className="text-coastal-secondary">Packets Sent</span>
                  <div className="text-lg font-bold text-coastal-text">{result.overall_sent}</div>
                </div>
                <div className="p-3 rounded bg-white border border-coastal-border">
                  <span className="text-coastal-secondary">Delivered</span>
                  <div className="text-lg font-bold text-emerald-700">{result.overall_delivered}</div>
                </div>
                <div className="p-3 rounded bg-white border border-coastal-border">
                  <span className="text-coastal-secondary">Lost / Dropped</span>
                  <div className="text-lg font-bold text-coastal-rose">{result.overall_lost}</div>
                </div>
                <div className="p-3 rounded bg-white border border-coastal-border">
                  <span className="text-coastal-secondary">Delivery Ratio</span>
                  <div className="text-lg font-bold text-coastal-text">
                    {(result.overall_delivery_ratio * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Visual Bar Chart: Delivery Ratio by Traffic Class */}
              <div className="p-4 rounded bg-white border border-coastal-border space-y-2">
                <h4 className="text-xs font-semibold text-coastal-text uppercase tracking-wider">
                  Comparative Performance by Priority Queue
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2D9D5" />
                      <XAxis dataKey="name" stroke="#746E79" fontSize={11} />
                      <YAxis stroke="#746E79" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FBF8F2',
                          borderColor: '#E2D9D5',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Delivery Ratio (%)" fill="#6D9EBA" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Queue Delay (ms)" fill="#AA96B5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Class Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-coastal-border text-coastal-secondary uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3">Sent</th>
                      <th className="py-2 px-3">Delivered</th>
                      <th className="py-2 px-3">Lost</th>
                      <th className="py-2 px-3">Delivery Ratio</th>
                      <th className="py-2 px-3">Queue Delay</th>
                      <th className="py-2 px-3">Total Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coastal-border/60">
                    {result.classes.map((c) => (
                      <tr key={c.traffic_class} className="hover:bg-white/50">
                        <td className="py-2 px-3 font-semibold capitalize text-coastal-text">
                          {c.traffic_class}
                        </td>
                        <td className="py-2 px-3 font-mono">{c.packets_sent}</td>
                        <td className="py-2 px-3 font-mono text-emerald-800">{c.packets_delivered}</td>
                        <td className="py-2 px-3 font-mono text-coastal-rose">{c.packets_lost}</td>
                        <td className="py-2 px-3 font-bold">
                          {(c.delivery_ratio * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-coastal-secondary">{c.queue_delay_ms} ms</td>
                        <td className="py-2 px-3 text-coastal-secondary">{c.estimated_latency_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-coastal-secondary italic bg-coastal-powder/30 p-3 rounded">
                {result.details}
              </p>
            </div>
          ) : (
            <div className="py-28 text-center text-xs text-coastal-secondary rounded bg-coastal-cream border border-coastal-border">
              Select parameters and click "Simulate QoS Traffic Flow" to inspect packet queueing behavior.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
