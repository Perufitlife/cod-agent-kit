import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { 
  Package, 
  Phone, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  Clock,
  Workflow,
  AlertCircle
} from "lucide-react";

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type OrderDetails = {
  id: string;
  system_order_id: string;
  external_order_id: string | null;
  status: string;
  data: any;
  created_at: string;
  updated_at: string;
  needs_attention: boolean;
  notes: string[];
  customer_phone_e164: string | null;
  source: string | null;
};

type MessageThread = {
  id: string;
  message_text: string;
  created_at: string;
  type: 'incoming' | 'outgoing';
  sent_at?: string;
};

type WorkflowRun = {
  id: string;
  current_state: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  context: any;
};

export const OrderDetailModal = ({ orderId, isOpen, onClose }: OrderDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'workflow'>('details');

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order-details", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      
      if (error) throw error;
      return data as OrderDetails;
    },
    enabled: !!orderId && isOpen
  });

  // Fetch conversation and messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["order-messages", orderId],
    queryFn: async () => {
      if (!orderId || !order?.customer_phone_e164) return [];
      
      // Find conversation by phone
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_phone", order.customer_phone_e164)
        .maybeSingle();
      
      if (!conversation) return [];
      
      // Fetch both inbox and outbox messages
      const [inboxRes, outboxRes] = await Promise.all([
        supabase
          .from("messages_inbox")
          .select("id, message_text, created_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("messages_outbox")
          .select("id, message_text, created_at, sent_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true })
      ]);
      
      if (inboxRes.error || outboxRes.error) {
        throw inboxRes.error || outboxRes.error;
      }
      
      // Combine and sort messages
      const allMessages: MessageThread[] = [
        ...(inboxRes.data || []).map(msg => ({
          ...msg,
          type: 'incoming' as const
        })),
        ...(outboxRes.data || []).map(msg => ({
          ...msg,
          type: 'outgoing' as const
        }))
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      return allMessages;
    },
    enabled: !!orderId && !!order?.customer_phone_e164 && isOpen
  });

  // Fetch workflow runs
  const { data: workflowRuns = [], isLoading: workflowLoading } = useQuery({
    queryKey: ["order-workflow", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from("workflow_runs")
        .select("id, current_state, status, started_at, completed_at, context")
        .eq("order_id", orderId)
        .order("started_at", { ascending: false });
      
      if (error) throw error;
      return data as WorkflowRun[];
    },
    enabled: !!orderId && isOpen
  });

  if (!isOpen || !orderId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Order Details: {order?.system_order_id}</span>
            {order?.needs_attention && (
              <Badge variant="destructive" className="ml-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Needs Attention
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {orderLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : order ? (
          <div className="space-y-4">
            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <StatusBadge status={order.status} />
                <p className="text-xs text-muted-foreground mt-1">Status</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{order.source || 'Manual'}</p>
                <p className="text-xs text-muted-foreground">Source</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{messages.length}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg">
              {[
                { id: 'details', label: 'Details', icon: Package },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'workflow', label: 'Workflow', icon: Workflow }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center space-x-2"
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Button>
              ))}
            </div>

            <ScrollArea className="h-[400px]">
              {/* Order Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Customer:</span>
                        <span>{order.data?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span>{order.customer_phone_e164 || order.data?.customer_phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <span className="font-medium">Address:</span>
                          <p className="text-sm text-muted-foreground">
                            {order.data?.address ? (
                              `${order.data.address}, ${order.data.city || ''} ${order.data.province || ''} ${order.data.country || ''}`
                            ) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Created:</span>
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Updated:</span>
                        <span>{new Date(order.updated_at).toLocaleString()}</span>
                      </div>
                      {order.external_order_id && (
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">External ID:</span>
                          <span>{order.external_order_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Products */}
                  {order.data?.products && (
                    <div>
                      <h4 className="font-medium mb-2">Products</h4>
                      <div className="space-y-2">
                        {order.data.products.map((product: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <div>
                              <p className="font-medium">{product.product_name}</p>
                              <p className="text-sm text-muted-foreground">Qty: {product.quantity}</p>
                            </div>
                            <p className="font-medium">${product.unit_price}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && order.notes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <div className="space-y-2">
                        {order.notes.map((note: string, idx: number) => (
                          <div key={idx} className="p-2 bg-muted/30 rounded text-sm">
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-3">
                  {messagesLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No messages found for this order</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'incoming' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-xs p-3 rounded-lg ${
                          message.type === 'incoming' 
                            ? 'bg-muted text-foreground' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          <p className="text-sm">{message.message_text}</p>
                          <div className="flex items-center justify-end mt-2 space-x-1">
                            <Clock className="w-3 h-3 opacity-50" />
                            <span className="text-xs opacity-75">
                              {new Date(message.sent_at || message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Workflow Tab */}
              {activeTab === 'workflow' && (
                <div className="space-y-4">
                  {workflowLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : workflowRuns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Workflow className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No workflow runs found for this order</p>
                    </div>
                  ) : (
                    workflowRuns.map((run) => (
                      <div key={run.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>
                              {run.status}
                            </Badge>
                            <span className="font-medium">State: {run.current_state}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(run.started_at).toLocaleString()}
                          </span>
                        </div>
                        {run.context && Object.keys(run.context).length > 0 && (
                          <div className="bg-muted/30 p-2 rounded text-xs">
                            <pre>{JSON.stringify(run.context, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Order not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};