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

// Custom Diamond Node Component for Decisions - MUCH LARGER AND CLEARER
const DiamondNode = ({ data }: any) => {
  return (
    <div className="relative flex items-center justify-center">
      <div 
        className="w-48 h-48 border-4 transform rotate-45 flex items-center justify-center rounded-3xl shadow-strong"
        style={{
          background: data.gradient,
          borderColor: data.borderColor
        }}
      >
        <div className="transform -rotate-45 text-center p-4 max-w-40">
          <div className="text-4xl mb-3">
            {data.emoji}
          </div>
          <div 
            className="text-sm font-black leading-tight mb-2"
            style={{ color: data.textColor }}
          >
            {data.title}
          </div>
          <div 
            className="text-xs font-semibold opacity-80"
            style={{ color: data.textColor }}
          >
            {data.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Action Node - RECTANGULAR AND DISTINCT
const ActionNode = ({ data }: any) => {
  return (
    <div 
      className="min-w-48 rounded-2xl border-4 shadow-strong p-6"
      style={{
        background: data.gradient,
        borderColor: data.borderColor
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-4xl mb-3">
          {data.emoji}
        </div>
        <div 
          className="text-lg font-black mb-2"
          style={{ color: data.textColor }}
        >
          {data.title}
        </div>
        <div 
          className="text-sm font-semibold opacity-80"
          style={{ color: data.textColor }}
        >
          {data.subtitle}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  diamond: DiamondNode,
  action: ActionNode,
};

const createNodesFromDefinition = (definition: any): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!definition?.actions) {
    return { nodes, edges };
  }

  let currentX = 120;
  let currentY = 120;
  const horizontalSpacing = 400;
  const verticalSpacing = 300;

  // Create start node - MUCH BIGGER AND CLEARER
  nodes.push({
    id: 'start',
    type: 'action',
    position: { x: currentX, y: currentY },
    data: { 
      emoji: '🚀',
      title: 'NUEVA ORDEN',
      subtitle: 'Se crea orden pendiente',
      gradient: 'linear-gradient(135deg, hsl(142 76% 45% / 0.2), hsl(142 76% 55% / 0.4))',
      borderColor: 'hsl(142 76% 45%)',
      textColor: 'hsl(142 76% 25%)'
    }
  });

  currentX += horizontalSpacing;
  let previousNodeId = 'start';

  for (let index = 0; index < definition.actions.length; index++) {
    const action = definition.actions[index];
    const nodeId = `action-${index}`;
    
    // Special handling for different action types
    if (action.action_type === 'wait') {
      // Wait action - RECTANGULAR ACTION NODE
      nodes.push({
        id: nodeId,
        type: 'action',
        position: { x: currentX, y: currentY },
        data: { 
          emoji: '⏱️',
          title: 'ESPERAR',
          subtitle: `${action.config?.duration || 1} minuto`,
          gradient: 'linear-gradient(135deg, hsl(38 92% 50% / 0.2), hsl(38 92% 60% / 0.4))',
          borderColor: 'hsl(38 92% 50%)',
          textColor: 'hsl(38 92% 25%)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 3 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

    } else if (action.action_type === 'check_condition') {
      // Condition - LARGE DIAMOND with VERY CLEAR CONDITIONAL LOGIC
      nodes.push({
        id: nodeId,
        type: 'diamond',
        position: { x: currentX - 96, y: currentY - 96 },
        data: { 
          emoji: '❓',
          title: 'CONDICIÓN',
          subtitle: `¿Tiene "${action.config?.tag_name}"?`,
          gradient: 'linear-gradient(135deg, hsl(262 83% 58% / 0.2), hsl(262 83% 68% / 0.4))',
          borderColor: 'hsl(262 83% 58%)',
          textColor: 'hsl(262 83% 25%)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 3 }
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
          type: 'action',
          position: { x: currentX - horizontalSpacing, y: currentY + verticalSpacing },
          data: { 
            emoji: '🛑',
            title: 'FIN TEMPRANO',
            subtitle: endAction.config?.reason || 'Orden ya procesada',
            gradient: 'linear-gradient(135deg, hsl(0 84% 60% / 0.2), hsl(0 84% 70% / 0.4))',
            borderColor: 'hsl(0 84% 60%)',
            textColor: 'hsl(0 84% 25%)'
          }
        });

        edges.push({
          id: `edge-${nodeId}-${endNodeId}`,
          source: nodeId,
          target: endNodeId,
          type: 'smoothstep',
          label: '✅ SÍ TIENE TAG',
          labelStyle: { 
            fill: 'hsl(0 84% 60%)', 
            fontWeight: '900', 
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          },
          labelBgStyle: { 
            fill: 'hsl(var(--background))', 
            fillOpacity: 0.95
          },
          style: { stroke: 'hsl(0 84% 60%)', strokeWidth: 4 }
        });
      }

    } else if (action.action_type === 'ai_agent_decision') {
      // AI Decision - LARGE DIAMOND for DECISION POINT
      nodes.push({
        id: nodeId,
        type: 'diamond',
        position: { x: currentX - 96, y: currentY - 96 },
        data: { 
          emoji: '🤖',
          title: 'IA DECIDE',
          subtitle: 'Analiza la orden',
          gradient: 'linear-gradient(135deg, hsl(262 83% 95% / 0.6), hsl(262 83% 85% / 0.8))',
          borderColor: 'hsl(262 83% 58%)',
          textColor: 'hsl(262 83% 25%)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        label: '❌ NO TIENE TAG',
        labelStyle: { 
          fill: 'hsl(142 76% 45%)', 
          fontWeight: '900', 
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        },
        labelBgStyle: { 
          fill: 'hsl(var(--background))', 
          fillOpacity: 0.95
        },
        style: { stroke: 'hsl(142 76% 45%)', strokeWidth: 4 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

    } else if (action.action_type === 'update_order') {
      // Update order action - RECTANGULAR ACTION
      nodes.push({
        id: nodeId,
        type: 'action',
        position: { x: currentX, y: currentY },
        data: { 
          emoji: '📋',
          title: 'CONFIRMAR ORDEN',
          subtitle: `Status: ${action.config?.status}`,
          gradient: 'linear-gradient(135deg, hsl(262 83% 58% / 0.2), hsl(262 83% 68% / 0.4))',
          borderColor: 'hsl(262 83% 58%)',
          textColor: 'hsl(262 83% 25%)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        label: '🤖 IA APRUEBA',
        labelStyle: { 
          fill: 'hsl(262 83% 58%)', 
          fontWeight: '900', 
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        },
        labelBgStyle: { 
          fill: 'hsl(var(--background))', 
          fillOpacity: 0.95
        },
        style: { stroke: 'hsl(262 83% 58%)', strokeWidth: 4 }
      });

      currentX += horizontalSpacing;
      previousNodeId = nodeId;

    } else if (action.action_type === 'send_message') {
      // Send message action - FINAL ACTION
      nodes.push({
        id: nodeId,
        type: 'action',
        position: { x: currentX, y: currentY },
        data: { 
          emoji: '💬',
          title: 'NOTIFICAR CLIENTE',
          subtitle: 'Envía confirmación',
          gradient: 'linear-gradient(135deg, hsl(200 100% 70% / 0.2), hsl(200 100% 80% / 0.4))',
          borderColor: 'hsl(200 100% 50%)',
          textColor: 'hsl(200 100% 25%)'
        }
      });

      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: 'hsl(200 100% 50%)', strokeWidth: 3 }
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
      type: 'action',
      position: { x: currentX, y: currentY },
      data: { 
        emoji: '🏁',
        title: 'COMPLETADO',
        subtitle: 'Orden procesada exitosamente',
        gradient: 'linear-gradient(135deg, hsl(142 76% 45% / 0.2), hsl(142 76% 55% / 0.4))',
        borderColor: 'hsl(142 76% 45%)',
        textColor: 'hsl(142 76% 25%)'
      }
    });

    edges.push({
      id: `edge-${previousNodeId}-final_success`,
      source: previousNodeId,
      target: 'final_success',
      type: 'smoothstep',
      style: { stroke: 'hsl(142 76% 45%)', strokeWidth: 3 }
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
    <div className="h-[500px] w-full rounded-xl overflow-hidden bg-gradient-to-br from-background to-muted/30 border border-border shadow-soft">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isEditable ? onNodesChange : undefined}
        onEdgesChange={isEditable ? onEdgesChange : undefined}
        onConnect={isEditable ? onConnect : undefined}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 0.8,
          minZoom: 0.2
        }}
        attributionPosition="bottom-right"
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Controls className="!bg-background/95 backdrop-blur border border-border rounded-lg shadow-medium" />
        <MiniMap 
          className="!bg-background/95 backdrop-blur border border-border rounded-lg shadow-medium"
          nodeColor={() => 'hsl(var(--muted-foreground))'}
          maskColor="hsl(var(--background) / 0.8)"
        />
        <Background color="hsl(var(--muted-foreground) / 0.1)" gap={30} />
      </ReactFlow>
    </div>
  );
};