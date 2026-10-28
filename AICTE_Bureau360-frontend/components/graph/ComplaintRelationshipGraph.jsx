'use client';

import React, { useState } from 'react';
import styles from '../../app/dashboard.module.css';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { NetworkIcon, AlertTriangleIcon, BuildingIcon, ShieldIcon } from '../icons/Icons';
import { RELATIONSHIP_GRAPH_DATA, COMPLAINT_CASES } from '../../data/mockData';

export function ComplaintRelationshipGraph({ onInspectCase }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterOverlapOnly, setFilterOverlapOnly] = useState(false);

  // Layout node positions in circular/concentric formation
  // Center: Bureaus, Middle ring: Institutions, Outer ring: Cases
  const nodePositions = {
    // Bureaus (Central circle)
    bureau_ab: { x: 400, y: 170 },
    bureau_papb: { x: 530, y: 230 },
    bureau_sdc: { x: 480, y: 350 },
    bureau_grc: { x: 320, y: 350 },
    bureau_vc: { x: 270, y: 230 },

    // Institutions (Middle ring)
    inst_apex: { x: 200, y: 110 },
    inst_saraswati: { x: 600, y: 110 },
    inst_modern: { x: 640, y: 370 },
    inst_greenfield: { x: 400, y: 460 },
    inst_kolkata: { x: 160, y: 370 },

    // Cases (Outer orbit)
    c_0891: { x: 100, y: 80 },
    c_0884: { x: 700, y: 80 },
    c_0850: { x: 720, y: 450 },
    c_0865: { x: 400, y: 530 },
    c_0742: { x: 80, y: 450 },
  };

  const filteredEdges = RELATIONSHIP_GRAPH_DATA.edges.filter((e) => {
    if (filterOverlapOnly && !e.isOverlap) return false;
    return true;
  });

  const isNodeConnected = (nodeId) => {
    if (!selectedNode) return true;
    if (selectedNode.id === nodeId) return true;
    return RELATIONSHIP_GRAPH_DATA.edges.some(
      (e) => (e.from === selectedNode.id && e.to === nodeId) || (e.to === selectedNode.id && e.from === nodeId)
    );
  };

  const isEdgeConnected = (edge) => {
    if (!selectedNode) return true;
    return edge.from === selectedNode.id || edge.to === selectedNode.id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Graph Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NetworkIcon size={18} />
          <strong>Interactive Complaint & Multi-Bureau Topology Graph</strong>
          <Badge variant="info">5 Bureaus • 5 Colleges • 5 Target Dockets</Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant={filterOverlapOnly ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterOverlapOnly(!filterOverlapOnly)}
          >
            {filterOverlapOnly ? 'Showing Overlap Edges Only' : 'Show All Network Links'}
          </Button>

          {selectedNode && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
              Reset Focus
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 320px' : '1fr', gap: 'var(--space-4)' }}>
        {/* SVG Graph Viewport */}
        <div style={{ background: '#0b1f36', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', position: 'relative' }}>
          <svg viewBox="0 0 800 580" style={{ width: '100%', height: 'auto', display: 'block', minHeight: '440px' }}>
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render Edges */}
            {filteredEdges.map((edge, i) => {
              const p1 = nodePositions[edge.from];
              const p2 = nodePositions[edge.to];
              if (!p1 || !p2) return null;
              const connected = isEdgeConnected(edge);

              return (
                <g key={i}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={edge.color || (edge.isOverlap ? '#f97316' : '#475569')}
                    strokeWidth={edge.isOverlap ? (connected ? 3 : 2) : (connected ? 2 : 1)}
                    strokeDasharray={edge.isOverlap ? '6 4' : 'none'}
                    opacity={connected ? 1 : 0.25}
                    filter={edge.isOverlap && connected ? 'url(#glow)' : undefined}
                  />
                  {edge.isOverlap && (
                    <text
                      x={(p1.x + p2.x) / 2}
                      y={(p1.y + p2.y) / 2 - 6}
                      fill="#f97316"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      opacity={connected ? 1 : 0.4}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {RELATIONSHIP_GRAPH_DATA.nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              const connected = isNodeConnected(node.id);
              const isSelected = selectedNode?.id === node.id;
              const r = node.type === 'bureau' ? 24 : node.type === 'institution' ? 20 : 16;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(node)}
                  style={{ cursor: 'pointer' }}
                  opacity={connected ? 1 : 0.25}
                >
                  <circle
                    r={isSelected ? r + 5 : r}
                    fill={node.color}
                    stroke={isSelected ? '#ffffff' : '#94a3b8'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    filter={isSelected ? 'url(#glow)' : undefined}
                  />
                  <text
                    y={node.type === 'case' ? 4 : 5}
                    fill="#ffffff"
                    fontSize={node.type === 'bureau' ? '9' : node.type === 'institution' ? '8' : '8'}
                    fontWeight="bold"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {node.type === 'bureau' ? node.label.slice(0, 3) : node.type === 'case' ? node.label.replace('CASE-', '#') : 'Inst'}
                  </text>
                  <text
                    y={r + 14}
                    fill="#e2e8f0"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Graph Legend */}
          <div style={{ position: 'absolute', bottom: '12px', left: '16px', background: 'rgba(11, 31, 54, 0.85)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '12px', fontSize: '0.6875rem', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0d2946', border: '1px solid #94a3b8' }} /> Bureaus
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#334155' }} /> Institutions
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} /> Complaints
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '16px', height: '2px', background: '#f97316', borderTop: '2px dashed #f97316' }} /> Cross-Cell Overlap
            </span>
          </div>
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant={selectedNode.type === 'bureau' ? 'info' : selectedNode.type === 'case' ? 'critical' : 'neutral'}>
                {selectedNode.type.toUpperCase()}
              </Badge>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                {selectedNode.label}
              </h4>
              {selectedNode.pid && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  PID: {selectedNode.pid}
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {selectedNode.type === 'bureau' && 'Central AICTE administrative cell handling domain-specific regulatory filings.'}
              {selectedNode.type === 'institution' && 'Approved technical institution with active grievance or compliance dockets.'}
              {selectedNode.type === 'case' && 'Complaint petition correlated across one or more cells.'}
            </div>

            {/* Direct Inspection Action */}
            {selectedNode.type === 'case' && (
              <div style={{ marginTop: 'auto' }}>
                <Button
                  variant="primary"
                  size="sm"
                  style={{ width: '100%' }}
                  onClick={() => {
                    const match = COMPLAINT_CASES.find((c) => c.id.includes(selectedNode.label.replace('CASE-', '')));
                    if (match) onInspectCase(match);
                  }}
                >
                  Inspect Case Dossier
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
