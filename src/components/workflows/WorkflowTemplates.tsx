import { WorkflowAction } from './WorkflowEditor';

export const createOrderProcessingWorkflow = (): WorkflowAction[] => {
  return [
    {
      id: crypto.randomUUID(),
      sequence_order: 1,
      action_type: "wait",
      config: { duration: 1 },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 2,
      action_type: "check_condition",
      config: { 
        condition_type: "has_tag",
        tag_name: "order_linked"
      },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 3,
      action_type: "end_workflow",
      config: { reason: "Orden ya vinculada - no requiere procesamiento" },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 4,
      action_type: "ai_agent_decision",
      config: {
        prompt: `Analiza la información de la orden y determina si puedo confirmarla y programarla para mañana.

Información de la orden:
- Teléfono: {{customer_phone}}
- Nombre: {{customer_name}}
- Número de orden: {{order_id}}
- Dirección: {{address}}
- Referencia: {{reference}}
- Distrito: {{district}}
- Ciudad: {{city}}
- Provincia: {{province}}
- País: {{country}}
- Productos: {{products}}
- Cantidad: {{quantity}}
- Total: {{total}}

Decide:
1. confirm_order - si toda la información está completa y válida
2. reject_order - si falta información crítica o hay inconsistencias`,
        option_1: "confirm_order",
        option_2: "reject_order"
      },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 5,
      action_type: "update_order",
      config: { status: "confirmed" },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 6,
      action_type: "send_message",
      config: { 
        message: "¡Perfecto! Tu pedido ha sido confirmado y programado para mañana. Te enviaremos los detalles de entrega pronto. 📦✅" 
      },
    },
  ];
};

export const workflowTemplates = {
  'order_processing': {
    name: 'Procesamiento Inteligente de Órdenes',
    description: 'Flujo automático con validación IA: Espera 1min → Verifica etiquetas → IA analiza → Confirma/Rechaza',
    actions: createOrderProcessingWorkflow(),
    triggers: [
      {
        id: crypto.randomUUID(),
        event_type: 'order_created',
        conditions: { status: 'pending' },
        is_active: true
      }
    ]
  }
};