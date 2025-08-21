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

const createNodesFromDefinition = (definition: any): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!definition?.actions) {
    return { nodes, edges };
  }

  // Create start node
  nodes.push({
    id: 'start',
    type: 'default',
    position: { x: 100, y: 50 },
    data: { 
      label: (
        <div className="text-center p-3">
          <div className="text-2xl mb-2">🚀</div>
          <div className="font-bold text-green-700">INICIO</div>
          <div className="text-xs text-green-600 mt-1">Nueva Orden Creada</div>
        </div>
      )
    },
    style: { 
      background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
      border: '3px solid #16a34a',
      borderRadius: '16px',
      minWidth: '160px',
      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
    }
  });

  // Create action nodes with improved layout
  let yPosition = 150;
  const xSpacing = 250;
  
  definition.actions?.forEach((action: any, index: number) => {
    const nodeId = `action-${index}`;
    let nodeLabel = '';
    let emoji = '';
    let nodeColor = '#ffffff';
    let borderColor = '#e2e8f0';
    let textColor = '#1e293b';

    switch (action.action_type) {
      case 'wait':
        emoji = '⏱️';
        nodeLabel = `Esperar ${action.config?.duration || 1} min`;
        nodeColor = '#fef3c7';
        borderColor = '#f59e0b';
        textColor = '#92400e';
        break;
      case 'send_message':
        emoji = '💬';
        nodeLabel = 'Enviar Mensaje';
        nodeColor = '#dbeafe';
        borderColor = '#3b82f6';
        textColor = '#1e40af';
        break;
      case 'update_order':
        emoji = '📋';
        nodeLabel = `Actualizar: ${action.config?.status || 'Estado'}`;
        nodeColor = '#e0e7ff';
        borderColor = '#6366f1';
        textColor = '#4338ca';
        break;
      case 'check_condition':
        emoji = '❓';
        nodeLabel = `¿Tiene "${action.config?.tag_name || 'etiqueta'}"?`;
        nodeColor = '#fef3c7';
        borderColor = '#f59e0b';
        textColor = '#92400e';
        break;
      case 'ai_agent_decision':
        emoji = '🤖';
        nodeLabel = 'IA Analiza Orden';
        nodeColor = '#f3e8ff';
        borderColor = '#9333ea';
        textColor = '#7c3aed';
        break;
      case 'end_workflow':
        emoji = '🛑';
        nodeLabel = action.config?.reason || 'Fin del Flujo';
        nodeColor = '#fee2e2';
        borderColor = '#dc2626';
        textColor = '#dc2626';
        break;
      default:
        emoji = '⚡';
        nodeLabel = action.action_type;
    }

    // Special positioning for conditional branches
    let xPos = 150;
    const isConditional = action.action_type === 'check_condition';
    
    nodes.push({
      id: nodeId,
      type: 'default',
      position: { x: xPos, y: yPosition },
      data: { 
        label: (
          <div className="text-center p-3">
            <div className="text-2xl mb-2">{emoji}</div>
            <div className="font-semibold text-sm mb-1" style={{ color: textColor }}>
              {nodeLabel}
            </div>
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ 
                borderColor: borderColor,
                color: textColor,
                backgroundColor: 'rgba(255,255,255,0.8)'
              }}
            >
              Paso {action.sequence_order}
            </Badge>
          </div>
        )
      },
      style: { 
        background: nodeColor,
        border: `3px solid ${borderColor}`,
        borderRadius: '16px',
        minWidth: '180px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }
    });

    // Handle special cases for end_workflow after check_condition
    if (action.action_type === 'end_workflow' && index > 0) {
      const prevAction = definition.actions[index - 1];
      if (prevAction?.action_type === 'check_condition') {
        // Position this as a side branch (NO path)
        nodes[nodes.length - 1].position.x = 400;
        nodes[nodes.length - 1].position.y = yPosition - 60;
      }
    }

    // Create edge from previous node
    const sourceId = index === 0 ? 'start' : `action-${index - 1}`;
    const prevAction = index > 0 ? definition.actions[index - 1] : null;
    
    // Add edge labels for conditional flows
    let edgeLabel = '';
    let edgeColor = '#64748b';
    
    if (prevAction?.action_type === 'check_condition') {
      if (action.action_type === 'end_workflow') {
        edgeLabel = 'SÍ (tiene etiqueta)';
        edgeColor = '#ef4444';
      } else {
        edgeLabel = 'NO (continúa)';
        edgeColor = '#22c55e';
      }
    }

    edges.push({
      id: `edge-${sourceId}-${nodeId}`,
      source: sourceId,
      target: nodeId,
      type: 'smoothstep',
      label: edgeLabel,
      labelStyle: { 
        fill: edgeColor, 
        fontWeight: 700, 
        fontSize: '12px',
        fontFamily: 'system-ui'
      },
      labelBgStyle: { 
        fill: '#ffffff', 
        fillOpacity: 0.9
      },
      style: { 
        stroke: edgeColor, 
        strokeWidth: 2 
      }
    });

    yPosition += 140;
  });

  // Add end node only for non-end actions
  const hasEndAction = definition.actions.some((action: any) => action.action_type === 'end_workflow');
  
  if (!hasEndAction) {
    const lastActionIndex = definition.actions.length - 1;
    const lastNodeId = lastActionIndex >= 0 ? `action-${lastActionIndex}` : 'start';
    
    nodes.push({
      id: 'end',
      type: 'default',
      position: { x: 150, y: yPosition },
      data: { 
        label: (
          <div className="text-center p-3">
            <div className="text-2xl mb-2">🏁</div>
            <div className="font-bold text-blue-700">COMPLETADO</div>
            <div className="text-xs text-blue-600 mt-1">Flujo Terminado</div>
          </div>
        )
      },
      style: { 
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
        border: '3px solid #3b82f6',
        borderRadius: '16px',
        minWidth: '160px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
      }
    });

    edges.push({
      id: `edge-${lastNodeId}-end`,
      source: lastNodeId,
      target: 'end',
      type: 'smoothstep',
      style: { stroke: '#3b82f6', strokeWidth: 2 }
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
      <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Workflow Defined</div>
          <div className="text-sm">Add actions to visualize the workflow</div>
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
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1.2,
          minZoom: 0.5
        }}
        attributionPosition="bottom-right"
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls className="bg-white/80 backdrop-blur border border-slate-200 rounded-lg shadow-md" />
        <MiniMap 
          className="bg-white/80 backdrop-blur border border-slate-200 rounded-lg shadow-md"
          nodeColor={(node) => {
            if (node.id === 'start') return '#16a34a';
            if (node.id === 'end') return '#3b82f6';
            if (node.id.includes('action-')) {
              const nodeData = nodes.find(n => n.id === node.id);
              const borderColor = nodeData?.style?.border;
              if (typeof borderColor === 'string') {
                return borderColor.split(' ')[2] || '#6b7280';
              }
              return '#6b7280';
            }
            return '#6b7280';
          }}
          maskColor="rgba(255, 255, 255, 0.6)"
        />
        <Background color="#e2e8f0" gap={20} />
      </ReactFlow>
    </div>
  );
};