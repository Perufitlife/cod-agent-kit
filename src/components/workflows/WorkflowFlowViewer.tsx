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

interface WorkflowFlowViewerProps {
  workflowDefinition?: any;
  workflowVersion?: any;
  isEditable?: boolean;
  onFlowChange?: (nodes: Node[], edges: Edge[]) => void;
}

// Custom Diamond Node Component for Decisions
const DiamondNode = ({ data }: any) => {
  return (
    <div className="relative">
      <div 
        className="w-32 h-32 border-3 transform rotate-45 flex items-center justify-center rounded-2xl shadow-medium"
        style={{
          background: `linear-gradient(135deg, ${data.bgStart || 'hsl(var(--warning) / 0.1)'}, ${data.bgEnd || 'hsl(var(--warning) / 0.2)'})`,
          borderColor: data.borderColor || 'hsl(var(--warning))'
        }}
      >
        <div className="transform -rotate-45 text-center p-2 max-w-28">
          <div className="text-2xl mb-1">
            {data.emoji}
          </div>
          <div 
            className="text-xs font-bold leading-tight"
            style={{ color: data.textColor || 'hsl(var(--warning-foreground))' }}
          >
            {data.title}
          </div>
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

  let currentX = 80;
  let currentY = 80;
  const horizontalSpacing = 280;
  const verticalSpacing = 220;

  // Create start node
  nodes.push({
    id: 'start',
    type: 'default',
    position: { x: currentX, y: currentY },
    data: { 
      label: (
        <div className="flex flex-col items-center p-4 min-w-40">
          <div className="text-3xl mb-2">🚀</div>
          <div className="font-bold text-success text-sm">NUEVA ORDEN</div>
          <div className="text-xs text-success/80 mt-1">Se crea orden pendiente</div>
        </div>
      )
    },
    style: { 
      background: 'linear-gradient(135deg, hsl(var(--success) / 0.1), hsl(var(--success) / 0.2))',
      border: '2px solid hsl(var(--success))',
      borderRadius: '16px',
      minWidth: '160px',
      boxShadow: '0 4px 16px hsl(var(--success) / 0.2)'
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
            <div className="flex flex-col items-center p-4 min-w-40">
              <div className="text-3xl mb-2">⏱️</div>
              <div className="font-bold text-warning text-sm">ESPERAR</div>
              <div className="text-xs text-warning/80 mt-1">{action.config?.duration || 1} minuto</div>
            </div>
          )
        },
        style: { 
          background: 'linear-gradient(135deg, hsl(var(--warning) / 0.1), hsl(var(--warning) / 0.2))',
          border: '2px solid hsl(var(--warning))',
          borderRadius: '16px',
          minWidth: '160px',
          boxShadow: '0 4px 16px hsl(var(--warning) / 0.2)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

    } else if (action.action_type === 'check_condition') {
      // Condition - diamond shape
      nodes.push({
        id: nodeId,
        type: 'diamond',
        position: { x: currentX - 64, y: currentY - 64 },
        data: { 
          emoji: '❓',
          title: `¿Tiene "${action.config?.tag_name}"?`,
          bgStart: 'hsl(var(--primary) / 0.1)',
          bgEnd: 'hsl(var(--primary) / 0.2)',
          borderColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--primary-foreground))'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 }
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
              <div className="flex flex-col items-center p-4 min-w-40">
                <div className="text-3xl mb-2">🛑</div>
                <div className="font-bold text-destructive text-sm">FIN</div>
                <div className="text-xs text-destructive/80 mt-1">{endAction.config?.reason || 'Orden ya procesada'}</div>
              </div>
            )
          },
          style: { 
            background: 'linear-gradient(135deg, hsl(var(--destructive) / 0.1), hsl(var(--destructive) / 0.2))',
            border: '2px solid hsl(var(--destructive))',
            borderRadius: '16px',
            minWidth: '160px',
            boxShadow: '0 4px 16px hsl(var(--destructive) / 0.2)'
          }
        });

        edges.push({
          id: `edge-${nodeId}-${endNodeId}`,
          source: nodeId,
          target: endNodeId,
          type: 'smoothstep',
          label: 'SÍ',
          labelStyle: { 
            fill: 'hsl(var(--destructive))', 
            fontWeight: '700', 
            fontSize: '12px'
          },
          labelBgStyle: { 
            fill: 'hsl(var(--background))', 
            fillOpacity: 0.9
          },
          style: { stroke: 'hsl(var(--destructive))', strokeWidth: 2 }
        });
      }

    } else if (action.action_type === 'ai_agent_decision') {
      // AI Decision - diamond shape
      nodes.push({
        id: nodeId,
        type: 'diamond',
        position: { x: currentX - 64, y: currentY - 64 },
        data: { 
          emoji: '🤖',
          title: 'IA Analiza Orden',
          bgStart: 'hsl(var(--accent) / 0.3)',
          bgEnd: 'hsl(var(--accent) / 0.5)',
          borderColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--primary-foreground))'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        label: 'NO',
        labelStyle: { 
          fill: 'hsl(var(--success))', 
          fontWeight: '700', 
          fontSize: '12px'
        },
        labelBgStyle: { 
          fill: 'hsl(var(--background))', 
          fillOpacity: 0.9
        },
        style: { stroke: 'hsl(var(--success))', strokeWidth: 2 }
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
            <div className="flex flex-col items-center p-4 min-w-40">
              <div className="text-3xl mb-2">📋</div>
              <div className="font-bold text-primary text-sm">CONFIRMAR</div>
              <div className="text-xs text-primary/80 mt-1">Status: {action.config?.status}</div>
            </div>
          )
        },
        style: { 
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.2))',
          border: '2px solid hsl(var(--primary))',
          borderRadius: '16px',
          minWidth: '160px',
          boxShadow: '0 4px 16px hsl(var(--primary) / 0.2)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        label: 'CONFIRMAR',
        labelStyle: { 
          fill: 'hsl(var(--primary))', 
          fontWeight: '700', 
          fontSize: '12px'
        },
        labelBgStyle: { 
          fill: 'hsl(var(--background))', 
          fillOpacity: 0.9
        },
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
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
            <div className="flex flex-col items-center p-4 min-w-40">
              <div className="text-3xl mb-2">💬</div>
              <div className="font-bold text-accent-foreground text-sm">NOTIFICAR</div>
              <div className="text-xs text-accent-foreground/80 mt-1">Envía confirmación</div>
            </div>
          )
        },
        style: { 
          background: 'linear-gradient(135deg, hsl(var(--accent) / 0.3), hsl(var(--accent) / 0.5))',
          border: '2px solid hsl(var(--accent-foreground))',
          borderRadius: '16px',
          minWidth: '160px',
          boxShadow: '0 4px 16px hsl(var(--accent) / 0.3)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--accent-foreground))', strokeWidth: 2 }
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
          <div className="flex flex-col items-center p-4 min-w-40">
            <div className="text-3xl mb-2">🏁</div>
            <div className="font-bold text-success text-sm">COMPLETADO</div>
            <div className="text-xs text-success/80 mt-1">Orden procesada</div>
          </div>
        )
      },
      style: { 
        background: 'linear-gradient(135deg, hsl(var(--success) / 0.1), hsl(var(--success) / 0.2))',
        border: '2px solid hsl(var(--success))',
        borderRadius: '16px',
        minWidth: '160px',
        boxShadow: '0 4px 16px hsl(var(--success) / 0.2)'
      }
    });

    edges.push({
      id: `edge-${previousNodeId}-final_success`,
      source: previousNodeId,
      target: 'final_success',
      type: 'smoothstep',
      style: { stroke: 'hsl(var(--success))', strokeWidth: 2 }
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
      <div className="h-96 flex items-center justify-center border-2 border-dashed border-muted rounded-xl bg-gradient-to-br from-muted/20 to-accent/10">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🤖</div>
          <div className="text-xl font-bold mb-2 text-foreground">No hay flujo definido</div>
          <div className="text-sm text-muted-foreground">Usa el botón "Usar Template IA" para crear el flujo automático</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden bg-gradient-to-br from-background to-muted/30 border border-border shadow-soft">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isEditable ? onNodesChange : undefined}
        onEdgesChange={isEditable ? onEdgesChange : undefined}
        onConnect={isEditable ? onConnect : undefined}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.15,
          maxZoom: 1,
          minZoom: 0.3
        }}
        attributionPosition="bottom-right"
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
      >
        <Controls className="!bg-background/95 backdrop-blur border border-border rounded-lg shadow-medium" />
        <MiniMap 
          className="!bg-background/95 backdrop-blur border border-border rounded-lg shadow-medium"
          nodeColor={() => 'hsl(var(--muted-foreground))'}
          maskColor="hsl(var(--background) / 0.8)"
        />
        <Background color="hsl(var(--muted-foreground) / 0.1)" gap={20} />
      </ReactFlow>
    </div>
  );
};