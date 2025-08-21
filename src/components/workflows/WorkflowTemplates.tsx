import { WorkflowAction } from './WorkflowEditor';

export const createOrderProcessingWorkflow = (): WorkflowAction[] => {
  return [
    {
      id: crypto.randomUUID(),
      sequence_order: 1,
      action_type: "wait",
      config: { duration: 1 }, // 1 minute delay
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
      config: { reason: "Order already linked - no further processing needed" },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 4,
      action_type: "ai_agent_decision",
      config: {
        prompt: `Analyze the order information and determine if I can confirm the order and schedule it for tomorrow. 
        
Consider the following order details:
- Phone: {{customer_phone}}
- Name: {{customer_name}}
- Order Number: {{order_id}}
- Address: {{address}}
- Reference: {{reference}}
- District: {{district}}
- City: {{city}}
- Province: {{province}}
- Country: {{country}}
- Products: {{products}}
- Quantity: {{quantity}}
- Total: {{total}}

Decide if you should:
1. confirm_order - if all information looks complete and valid
2. reject_order - if critical information is missing or invalid`,
        option_1: "confirm_order",
        option_2: "reject_order"
      },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 5,
      action_type: "branch",
      config: { description: "Handle AI decision result" },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 6,
      action_type: "update_order",
      config: { status: "confirmed" },
    },
    {
      id: crypto.randomUUID(),
      sequence_order: 7,
      action_type: "send_message",
      config: { 
        message: "¡Gracias! Tu pedido ha sido confirmado y programado para mañana. Recibirás más detalles pronto." 
      },
    },
  ];
};

export const workflowTemplates = {
  'order_processing': {
    name: 'Order Processing with AI',
    description: 'Complete order processing workflow with AI validation and conditional logic',
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