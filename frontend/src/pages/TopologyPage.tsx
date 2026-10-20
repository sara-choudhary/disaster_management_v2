import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Server,
  Router as RouterIcon,
  HardDrive,
  Laptop,
} from 'lucide-react';
import { api } from '../services/api';
import { NetworkNode, NetworkLink } from '../types';

export const TopologyPage: React.FC = () => {
  const [nodesData, setNodesData] = useState<NetworkNode[]>([]);
  const [linksData, setLinksData] = useState<NetworkLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [highlightedRoute] = useState<string[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const loadTopology = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTopology();
      setNodesData(data.nodes);
      setLinksData(data.links);
    } catch (err) {
      console.error('Failed to load topology:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopology();
  }, [loadTopology]);

  // Transform Database Nodes & Links into React Flow Nodes & Edges
  useEffect(() => {
    if (nodesData.length === 0) return;

    // Build Nodes
    const rfNodes: Node[] = nodesData.map((node) => {
      let coords = { x: 400, y: 300 };
      if (node.node_metadata) {
        try {
          const meta = JSON.parse(node.node_metadata);
          if (meta.x !== undefined && meta.y !== undefined) {
            coords = { x: meta.x, y: meta.y };
          }
        } catch {
          // fallback
        }
      }

      const isFailed = node.status === 'failed';
      const isSelected = selectedNode?.device_id === node.device_id;
      const isInRoute = highlightedRoute.includes(node.device_id);

      return {
        id: node.device_id,
        position: coords,
        data: {
          label: (
            <div className="flex items-center gap-2">
              {node.node_type === 'router' && <RouterIcon className="w-4 h-4 shrink-0" />}
              {node.node_type === 'switch' && <HardDrive className="w-4 h-4 shrink-0" />}
              {node.node_type === 'server' && <Server className="w-4 h-4 shrink-0" />}
              {node.node_type === 'endpoint' && <Laptop className="w-4 h-4 shrink-0" />}
              <div className="text-left leading-tight">
                <div className="font-bold text-xs">{node.device_id}</div>
                <div className="text-[10px] opacity-80 truncate max-w-[100px]">{node.name}</div>
              </div>
            </div>
          ),
          rawNode: node,
        },
        style: {
          backgroundColor: isFailed
            ? '#CC858D' // Critical / Failed
            : isSelected
            ? '#FBF8F2'
            : isInRoute
            ? '#DCEAF3'
            : '#FBF8F2',
          borderColor: isFailed
            ? '#C98F9B'
            : isSelected
            ? '#393640'
            : isInRoute
            ? '#6D9EBA'
            : '#E2D9D5',
          borderWidth: isSelected || isInRoute ? '2px' : '1px',
          color: isFailed ? '#ffffff' : '#393640',
          borderRadius: node.node_type === 'router' ? '9999px' : '6px',
          padding: '8px 12px',
          fontSize: '12px',
          boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
        },
      };
    });

    // Build Edges (Only draw unique undirected representation to avoid line duplication)
    const drawnPairs = new Set<string>();
    const rfEdges: Edge[] = [];

    linksData.forEach((link) => {
      const pairKey = [link.source_id, link.target_id].sort().join('--');
      if (drawnPairs.has(pairKey)) return;
      drawnPairs.add(pairKey);

      const isDown = link.status === 'down';
      const isSelected = selectedLink?.link_id === link.link_id;

      // Check if this link is part of the highlighted route
      let inRoute = false;
      for (let i = 0; i < highlightedRoute.length - 1; i++) {
        const u = highlightedRoute[i];
        const v = highlightedRoute[i + 1];
        if (
          (link.source_id === u && link.target_id === v) ||
          (link.source_id === v && link.target_id === u)
        ) {
          inRoute = true;
          break;
        }
      }

      rfEdges.push({
        id: link.link_id,
        source: link.source_id,
        target: link.target_id,
        animated: inRoute && !isDown,
        label: `${link.cost}`,
        style: {
          stroke: isDown
            ? '#CC858D' // Failed (Dusty rose)
            : inRoute
            ? '#AA96B5' // Alternate / Selected path (Muted mauve)
            : '#6D9EBA', // Ordinary Link (Cerulean)
          strokeWidth: isDown ? 2 : inRoute || isSelected ? 3.5 : 2,
          strokeDasharray: isDown ? '5,5' : undefined,
        },
        labelStyle: { fill: '#746E79', fontSize: 10, fontWeight: 600 },
        data: { rawLink: link },
      });
    });

    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [nodesData, linksData, selectedNode, selectedLink, highlightedRoute, setNodes, setEdges]);

  // Click Handlers
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedLink(null);
    setSelectedNode(node.data.rawNode);
  };

  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setSelectedNode(null);
    setSelectedLink(edge.data.rawLink);
  };

  // Node & Link Action Handlers
  const toggleNodeFailure = async (node: NetworkNode) => {
    try {
      if (node.status === 'healthy') {
        await api.failNode(node.device_id);
        setActionStatus(`Node ${node.device_id} marked offline.`);
      } else {
        await api.restoreNode(node.device_id);
        setActionStatus(`Node ${node.device_id} restored to operational status.`);
      }
      await loadTopology();
    } catch (err: any) {
      setActionStatus(`Error: ${err.message}`);
    }
  };

  const toggleLinkFailure = async (link: NetworkLink) => {
    try {
      if (link.status === 'up') {
        await api.failLink(link.link_id);
        setActionStatus(`Link ${link.link_id} disabled.`);
      } else {
        await api.restoreLink(link.link_id);
        setActionStatus(`Link ${link.link_id} restored.`);
      }
      await loadTopology();
    } catch (err: any) {
      setActionStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action status notification */}
      {actionStatus && (
        <div className="p-3 bg-coastal-cream border border-coastal-border rounded text-xs text-coastal-text flex items-center justify-between">
          <span>{actionStatus}</span>
          <button
            onClick={() => setActionStatus(null)}
            className="text-coastal-secondary hover:text-coastal-text font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* React Flow Canvas (3 cols) */}
        <div className="lg:col-span-3 h-[680px] bg-white rounded border border-coastal-border relative overflow-hidden shadow-xs">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            fitView
          >
            <Background color="#E2D9D5" gap={20} size={1} />
            <Controls className="bg-white border border-coastal-border shadow-xs" />
            <MiniMap
              nodeColor={(n) => {
                if (n.style?.backgroundColor) return n.style.backgroundColor as string;
                return '#DCEAF3';
              }}
              className="bg-white/90 border border-coastal-border rounded"
            />
          </ReactFlow>

          {/* Canvas Legend */}
          <div className="absolute bottom-4 left-4 p-3 rounded bg-white/95 border border-coastal-border text-[11px] text-coastal-secondary space-y-1.5 shadow-xs pointer-events-none">
            <div className="font-semibold text-coastal-text uppercase tracking-wider text-[10px]">
              Topology Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white border border-coastal-border inline-block" />
              <span>Healthy Device (Routers, Switches, Endpoints)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#CC858D] inline-block" />
              <span>Failed / Offline Resource</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#6D9EBA] inline-block" />
              <span>Operational Transit Link (Cerulean)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#AA96B5] inline-block" />
              <span>Selected / Alternate Path (Mauve)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t border-dashed border-[#CC858D] inline-block" />
              <span>Severed Link (Dusty Rose)</span>
            </div>
          </div>
        </div>

        {/* Inspector Sidebar (1 col) */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border h-[680px] overflow-y-auto space-y-4 shadow-xs">
          <div className="border-b border-coastal-border pb-3">
            <h3 className="text-sm font-semibold text-coastal-text">
              Resource Inspector
            </h3>
            <p className="text-xs text-coastal-secondary">
              Click any node or link on the canvas to inspect telemetry or simulate failure.
            </p>
          </div>

          {/* Selected Node Details */}
          {selectedNode && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-coastal-secondary">
                  Node Details
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    selectedNode.status === 'healthy'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-coastal-rose/20 text-coastal-rose'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-coastal-secondary">Device ID:</span>{' '}
                  <strong className="text-coastal-text">{selectedNode.device_id}</strong>
                </div>
                <div>
                  <span className="text-coastal-secondary">Name:</span>{' '}
                  <span className="text-coastal-text">{selectedNode.name}</span>
                </div>
                <div>
                  <span className="text-coastal-secondary">Type:</span>{' '}
                  <span className="text-coastal-text uppercase">{selectedNode.node_type}</span>
                </div>
                <div>
                  <span className="text-coastal-secondary">Department:</span>{' '}
                  <span className="text-coastal-text">{selectedNode.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-coastal-secondary">IP Address:</span>{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-coastal-border font-mono">
                    {selectedNode.ip_address}
                  </code>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => toggleNodeFailure(selectedNode)}
                className={`w-full mt-3 py-2 text-xs font-semibold rounded shadow-xs transition-colors ${
                  selectedNode.status === 'healthy'
                    ? 'bg-coastal-rose/20 text-coastal-rose hover:bg-coastal-rose/30 border border-coastal-rose/40'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {selectedNode.status === 'healthy' ? 'Simulate Device Failure' : 'Restore Device'}
              </button>
            </div>
          )}

          {/* Selected Link Details */}
          {selectedLink && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-coastal-secondary">
                  Link Details
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    selectedLink.status === 'up'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-coastal-rose/20 text-coastal-rose'
                  }`}
                >
                  {selectedLink.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-coastal-secondary">Link ID:</span>{' '}
                  <strong className="text-coastal-text">{selectedLink.link_id}</strong>
                </div>
                <div>
                  <span className="text-coastal-secondary">Endpoints:</span>{' '}
                  <span className="text-coastal-text font-mono">
                    {selectedLink.source_id} ↔ {selectedLink.target_id}
                  </span>
                </div>
                <div>
                  <span className="text-coastal-secondary">Bandwidth:</span>{' '}
                  <span className="text-coastal-text">{selectedLink.bandwidth} Mbps</span>
                </div>
                <div>
                  <span className="text-coastal-secondary">Estimated Latency:</span>{' '}
                  <span className="text-coastal-text">{selectedLink.latency} ms</span>
                </div>
                <div>
                  <span className="text-coastal-secondary">OSPF Metric Cost:</span>{' '}
                  <span className="text-coastal-text font-semibold">{selectedLink.cost}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => toggleLinkFailure(selectedLink)}
                className={`w-full mt-3 py-2 text-xs font-semibold rounded shadow-xs transition-colors ${
                  selectedLink.status === 'up'
                    ? 'bg-coastal-rose/20 text-coastal-rose hover:bg-coastal-rose/30 border border-coastal-rose/40'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {selectedLink.status === 'up' ? 'Sever Link (Simulate Cut)' : 'Restore Link'}
              </button>
            </div>
          )}

          {!selectedNode && !selectedLink && (
            <div className="py-12 text-center text-xs text-coastal-secondary">
              Select any node or link from the canvas to view operational parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
