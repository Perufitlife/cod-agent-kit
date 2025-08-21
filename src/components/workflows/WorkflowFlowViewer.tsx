import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from '@/components/ui/badge';

interface WorkflowFlowViewerProps {
  workflowDefinition?: any;
  workflowVersion?: any;
  isEditable?: boolean;
  onFlowChange?: (nodes: Node[], edges: Edge[]) => void;
}

// Custom Diamond Node Component for Decisions
const DiamondNode = ({ data }: any) => {
  return (
    <div 
      className="diamond-node"
      style={{
        width: '150px',
        height: '150px',
        background: data.background || '#fef3c7',
        border: `3px solid ${data.borderColor || '#f59e0b'}`,
        transform: 'rotate(45deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderRadius: '20px'
      }}
    >
      <div 
        style={{
          transform: 'rotate(-45deg)',
          textAlign: 'center',
          padding: '10px',
          maxWidth: '120px'
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>
          {data.emoji}
        </div>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: data.textColor || '#92400e',
          lineHeight: '1.2'
        }}>
          {data.title}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  diamond: DiamondNode,
};

const createNodesFromDefinition = (definition: any): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!definition?.actions) {
    return { nodes, edges };
  }

  let currentX = 100;
  let currentY = 50;
  const horizontalSpacing = 300;
  const verticalSpacing = 200;

  // Create start node
  nodes.push({
    id: 'start',
    type: 'default',
    position: { x: currentX, y: currentY },
    data: { 
      label: (
        <div className="text-center p-4 min-w-[160px]">
          <div className="text-3xl mb-2">🚀</div>
          <div className="font-bold text-green-700 text-sm">NUEVA ORDEN</div>
          <div className="text-xs text-green-600 mt-1">Se crea orden pendiente</div>
        </div>
      )
    },
    style: { 
      background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
      border: '3px solid #16a34a',
      borderRadius: '16px',
      minWidth: '160px',
      boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
    }
  });

  currentX += horizontalSpacing;
  let previousNodeId = 'start';

  for (let index = 0; index < definition.actions.length; index++) {
    const action = definition.actions[index];
    const nodeId = `action-${index}`;
    
    // Special handling for different action types
    if (action.action_type === 'wait') {
      // Wait action - simple rectangle
      nodes.push({
        id: nodeId,
        type: 'default',
        position: { x: currentX, y: currentY },
        data: { 
          label: (
            <div className="text-center p-4 min-w-[160px]">
              <div className="text-2xl mb-2">⏱️</div>
              <div className="font-bold text-amber-700 text-sm">ESPERAR</div>
              <div className="text-xs text-amber-600 mt-1">{action.config?.duration || 1} minuto</div>
            </div>
          )
        },
        style: { 
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
          border: '3px solid #f59e0b',
          borderRadius: '16px',
          minWidth: '160px',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: '#64748b', strokeWidth: 3 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

    } else if (action.action_type === 'check_condition') {
      // Condition - diamond shape
      nodes.push({
        id: nodeId,
        type: 'diamond',
        position: { x: currentX - 75, y: currentY - 75 },
        data: { 
          emoji: '❓',
          title: `¿Tiene "${action.config?.tag_name}"?`,
          background: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#92400e'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: '#64748b', strokeWidth: 3 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

      // Find the next action after condition (NO path) and end action (YES path)
      const nextActionIndex = index + 1;
      const endActionIndex = definition.actions.findIndex((a: any, i: number) => 
        i > index && a.action_type === 'end_workflow'
      );

      // Create YES path (to end_workflow)
      if (endActionIndex !== -1) {
        const endAction = definition.actions[endActionIndex];
        const endNodeId = `action-${endActionIndex}`;
        
        nodes.push({
          id: endNodeId,
          type: 'default',
          position: { x: currentX - horizontalSpacing, y: currentY + verticalSpacing },
          data: { 
            label: (
              <div className="text-center p-4 min-w-[160px]">
                <div className="text-2xl mb-2">🛑</div>
                <div className="font-bold text-red-700 text-sm">FIN</div>
                <div className="text-xs text-red-600 mt-1">{endAction.config?.reason || 'Orden ya procesada'}</div>
              </div>
            )
          },
          style: { 
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
            border: '3px solid #dc2626',
            borderRadius: '16px',
            minWidth: '160px',
            boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)'
          }
        });

        edges.push({
          id: `edge-${nodeId}-${endNodeId}`,
          source: nodeId,
          target: endNodeId,
          type: 'smoothstep',
          label: 'SÍ',
          labelStyle: { 
            fill: '#dc2626', 
            fontWeight: 700, 
            fontSize: '14px',
            fontFamily: 'system-ui'
          },
          labelBgStyle: { 
            fill: '#ffffff', 
            fillOpacity: 0.9
          },
          style: { stroke: '#dc2626', strokeWidth: 3 }
        });
      }

    } else if (action.action_type === 'ai_agent_decision') {
      // AI Decision - diamond shape
      nodes.push({
        id: nodeId,
        type: 'diamond',
        position: { x: currentX - 75, y: currentY - 75 },
        data: { 
          emoji: '🤖',
          title: 'IA Analiza Orden',
          background: '#f3e8ff',
          borderColor: '#9333ea',
          textColor: '#7c3aed'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        label: 'NO',
        labelStyle: { 
          fill: '#22c55e', 
          fontWeight: 700, 
          fontSize: '14px',
          fontFamily: 'system-ui'
        },
        labelBgStyle: { 
          fill: '#ffffff', 
          fillOpacity: 0.9
        },
        style: { stroke: '#22c55e', strokeWidth: 3 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

    } else if (action.action_type === 'update_order') {
      // Update order action
      nodes.push({
        id: nodeId,
        type: 'default',
        position: { x: currentX, y: currentY },
        data: { 
          label: (
            <div className="text-center p-4 min-w-[160px]">
              <div className="text-2xl mb-2">📋</div>
              <div className="font-bold text-indigo-700 text-sm">CONFIRMAR</div>
              <div className="text-xs text-indigo-600 mt-1">Status: {action.config?.status}</div>
            </div>
          )
        },
        style: { 
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', 
          border: '3px solid #6366f1',
          borderRadius: '16px',
          minWidth: '160px',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        label: 'CONFIRMAR',
        labelStyle: { 
          fill: '#6366f1', 
          fontWeight: 700, 
          fontSize: '14px',
          fontFamily: 'system-ui'
        },
        labelBgStyle: { 
          fill: '#ffffff', 
          fillOpacity: 0.9
        },
        style: { stroke: '#6366f1', strokeWidth: 3 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

    } else if (action.action_type === 'send_message') {
      // Send message action
      nodes.push({
        id: nodeId,
        type: 'default',
        position: { x: currentX, y: currentY },
        data: { 
          label: (
            <div className="text-center p-4 min-w-[160px]">
              <div className="text-2xl mb-2">💬</div>
              <div className="font-bold text-blue-700 text-sm">NOTIFICAR</div>
              <div className="text-xs text-blue-600 mt-1">Envía confirmación</div>
            </div>
          )
        },
        style: { 
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
          border: '3px solid #3b82f6',
          borderRadius: '16px',
          minWidth: '160px',
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 3 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

    } else if (action.action_type === 'end_workflow') {
      // Skip if already handled in condition
      continue;
    }
  }

  // Add final success node if not ending with end_workflow
  const lastAction = definition.actions[definition.actions.length - 1];
  if (lastAction?.action_type !== 'end_workflow') {
    nodes.push({
      id: 'final_success',
      type: 'default',
      position: { x: currentX, y: currentY },
      data: { 
        label: (
          <div className="text-center p-4 min-w-[160px]">
            <div className="text-3xl mb-2">🏁</div>
            <div className="font-bold text-green-700 text-sm">COMPLETADO</div>
            <div className="text-xs text-green-600 mt-1">Orden procesada</div>
          </div>
        )
      },
      style: { 
        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
        border: '3px solid #16a34a',
        borderRadius: '16px',
        minWidth: '160px',
        boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
      }
    });

    edges.push({
      id: `edge-${previousNodeId}-final_success`,
      source: previousNodeId,
      target: 'final_success',
      type: 'smoothstep',
      style: { stroke: '#16a34a', strokeWidth: 3 }
    });
  }

  return { nodes, edges };
};

export const WorkflowFlowViewer = ({ 
  workflowDefinition, 
  workflowVersion, 
  isEditable = false,
  onFlowChange 
}: WorkflowFlowViewerProps) => {
  const definition = workflowVersion?.definition || workflowDefinition;
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return createNodesFromDefinition(definition);
  }, [definition]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      if (onFlowChange) {
        onFlowChange(nodes, newEdges);
      }
    },
    [edges, nodes, onFlowChange, setEdges]
  );

  if (!definition || !definition.actions) {
    return (
      <div className="h-[600px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <div className="text-xl font-bold mb-2 text-slate-700">No hay flujo definido</div>
          <div className="text-sm text-slate-500">Usa el botón "Usar Template IA" para crear el flujo automático</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full border-2 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isEditable ? onNodesChange : undefined}
        onEdgesChange={isEditable ? onEdgesChange : undefined}
        onConnect={isEditable ? onConnect : undefined}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.1,
          maxZoom: 1,
          minZoom: 0.3
        }}
        attributionPosition="bottom-right"
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls className="bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-md" />
        <MiniMap 
          className="bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-md"
          nodeColor={() => '#64748b'}
          maskColor="rgba(255, 255, 255, 0.6)"
        />
        <Background color="#e2e8f0" gap={20} />
      </ReactFlow>
    </div>
  );
};