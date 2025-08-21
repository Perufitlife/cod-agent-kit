import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { MessageSandbox } from "@/components/crm/MessageSandbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Clock, Phone } from "lucide-react";

const Conversations = () => {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages_inbox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages_inbox')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <DashboardLayout currentPage="conversations">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Conversations
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage customer conversations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Conversations */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Recent Conversations
                </CardTitle>
                <CardDescription>Latest customer interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading conversations...</div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map((conversation) => (
                      <div key={conversation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{conversation.customer_phone}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(conversation.updated_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                          {conversation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversations found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Latest incoming messages</CardDescription>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="text-center py-4">Loading messages...</div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{message.customer_phone}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Sandbox */}
          <div className="lg:col-span-1">
            <MessageSandbox />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Conversations;