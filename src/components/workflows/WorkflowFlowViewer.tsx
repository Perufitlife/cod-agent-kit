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
        <div className="text-center">
          <div className="font-semibold text-green-600">START</div>
          <div className="text-xs text-muted-foreground">New Order Trigger</div>
        </div>
      )
    },
    style: { background: '#dcfce7', border: '2px solid #16a34a' }
  });

  // Create action nodes
  definition.actions?.forEach((action: any, index: number) => {
    const nodeId = `action-${index}`;
    let nodeLabel = '';
    let nodeColor = '#f3f4f6';
    let borderColor = '#6b7280';

    switch (action.action_type) {
      case 'wait':
        nodeLabel = `Wait ${action.config?.duration || 1} min`;
        nodeColor = '#fef3c7';
        borderColor = '#f59e0b';
        break;
      case 'send_message':
        nodeLabel = `Send Message`;
        nodeColor = '#dbeafe';
        borderColor = '#3b82f6';
        break;
      case 'update_order':
        nodeLabel = `Update to: ${action.config?.status || 'Unknown'}`;
        nodeColor = '#e0e7ff';
        borderColor = '#6366f1';
        break;
      case 'create_timer':
        nodeLabel = `Timer: ${action.config?.purpose || 'Unknown'}`;
        nodeColor = '#fce7f3';
        borderColor = '#ec4899';
        break;
      default:
        nodeLabel = action.action_type;
    }

    nodes.push({
      id: nodeId,
      type: 'default',
      position: { x: 100, y: 150 + (index * 120) },
      data: { 
        label: (
          <div className="text-center">
            <div className="font-medium">{nodeLabel}</div>
            <Badge variant="outline" className="text-xs mt-1">
              Step {action.sequence_order}
            </Badge>
          </div>
        )
      },
      style: { background: nodeColor, border: `2px solid ${borderColor}` }
    });

    // Create edge from previous node
    const sourceId = index === 0 ? 'start' : `action-${index - 1}`;
    edges.push({
      id: `edge-${sourceId}-${nodeId}`,
      source: sourceId,
      target: nodeId,
      type: 'smoothstep'
    });
  });

  // Add end node
  const lastActionIndex = definition.actions.length - 1;
  const lastNodeId = lastActionIndex >= 0 ? `action-${lastActionIndex}` : 'start';
  
  nodes.push({
    id: 'end',
    type: 'default',
    position: { x: 100, y: 150 + (definition.actions.length * 120) },
    data: { 
      label: (
        <div className="text-center">
          <div className="font-semibold text-red-600">END</div>
          <div className="text-xs text-muted-foreground">Workflow Complete</div>
        </div>
      )
    },
    style: { background: '#fee2e2', border: '2px solid #dc2626' }
  });

  edges.push({
    id: `edge-${lastNodeId}-end`,
    source: lastNodeId,
    target: 'end',
    type: 'smoothstep'
  });

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
    <div className="h-96 w-full border rounded-lg overflow-hidden bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isEditable ? onNodesChange : undefined}
        onEdgesChange={isEditable ? onEdgesChange : undefined}
        onConnect={isEditable ? onConnect : undefined}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.id === 'start') return '#16a34a';
            if (node.id === 'end') return '#dc2626';
            return '#6b7280';
          }}
        />
        <Background />
      </ReactFlow>
    </div>
  );
};