import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Smartphone, Bot, User, Clock } from "lucide-react";

type Inbox = { id: string; message_text: string; created_at: string | null };
type Outbox = { id: string; message_text: string; created_at: string | null; sent_at: string | null };

async function fetchThread(conversation_id: string) {
  console.log("fetchThread for conversation:", conversation_id);
  const [inbox, outbox] = await Promise.all([
    supabase.from("messages_inbox").select("id,message_text,created_at").eq("conversation_id", conversation_id).order("created_at", { ascending: true }),
    supabase.from("messages_outbox").select("id,message_text,created_at,sent_at").eq("conversation_id", conversation_id).order("created_at", { ascending: true }),
  ]);
  if (inbox.error) {
    console.error("Error fetching inbox:", inbox.error);
    throw inbox.error;
  }
  if (outbox.error) {
    console.error("Error fetching outbox:", outbox.error);
    throw outbox.error;
  }
  console.log("Fetched messages - inbox:", inbox.data?.length, "outbox:", outbox.data?.length);
  return { inbox: inbox.data || [], outbox: outbox.data || [] };
}

async function ensureConversation(phone: string) {
  console.log("ensureConversation for phone:", phone);
  // Busca conversación existente o crea una
  const { data, error } = await supabase.from("conversations").select("id").eq("customer_phone", phone).maybeSingle();
  if (error) {
    console.error("Error finding conversation:", error);
    throw error;
  }
  if (data?.id) {
    console.log("Found existing conversation:", data.id);
    return data.id;
  }
  console.log("Creating new conversation for phone:", phone);
  const ins = await supabase.from("conversations").insert({ tenant_id: "00000000-0000-0000-0000-000000000001", customer_phone: phone, status: "active" }).select("id").single();
  if (ins.error) {
    console.error("Error creating conversation:", ins.error);
    throw ins.error;
  }
  console.log("Created new conversation:", ins.data.id);
  return ins.data.id;
}

export const MessageSandbox = () => {
  const qc = useQueryClient();
  const [customerPhone, setCustomerPhone] = useState("+1234567890");
  const [conversationId, setConversationId] = useState<string>("");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    (async () => {
      const id = await ensureConversation(customerPhone);
      setConversationId(id);
    })();
  }, [customerPhone]);

  const { data, isLoading } = useQuery({
    queryKey: ["thread", conversationId],
    queryFn: () => fetchThread(conversationId),
    enabled: !!conversationId,
    refetchInterval: 1500,
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sandbox_message', {
        body: { 
          customer_phone: customerPhone, 
          message_text: messageText, 
          conversation_id: conversationId 
        }
      });
      
      if (error) {
        console.error("sandbox_message failed:", error);
        throw new Error(`sandbox_message failed: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      setMessageText("");
      qc.invalidateQueries({ queryKey: ["thread", conversationId] });
    },
  });

  const messages = useMemo(() => {
    const list: { id: string; type: "customer" | "agent"; content: string; ts: string }[] = [];
    console.log("Processing messages - inbox:", data?.inbox?.length, "outbox:", data?.outbox?.length);
    (data?.inbox || []).forEach((m: Inbox) => list.push({ id: `in-${m.id}`, type: "customer", content: m.message_text, ts: m.created_at || "" }));
    (data?.outbox || []).forEach((m: Outbox) => list.push({ id: `out-${m.id}`, type: "agent", content: m.message_text, ts: m.sent_at || m.created_at || "" }));
    const sorted = list.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    console.log("Total sorted messages:", sorted.length);
    return sorted;
  }, [data]);

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <span>Message Sandbox</span>
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">WhatsApp Simulation</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-4 h-80 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              <p className="mt-2 text-muted-foreground">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Start a conversation by sending a message!</p>
              <p className="text-xs mt-1">Try: "confirm my order" or "Hello"</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.type === "customer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${m.type === "customer" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border border-border"}`}>
                  <div className="flex items-center space-x-2 mb-1">{m.type === "customer" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}<span className="text-xs opacity-75">{m.type === "customer" ? "Customer" : "AI Agent"}</span></div>
                  <p className="text-sm">{m.content}</p>
                  <div className="flex items-center justify-end mt-2 space-x-1"><Clock className="w-3 h-3 opacity-50" /><span className="text-xs opacity-75">{m.ts ? new Date(m.ts).toLocaleTimeString() : ""}</span></div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
          <div>
            <label className="text-sm font-medium block">Customer Phone Number</label>
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+1234567890" className="bg-background" />
          </div>
          <div>
            <label className="text-sm font-medium block">Message</label>
            <div className="flex space-x-2">
              <Textarea 
                value={messageText} 
                onChange={(e) => setMessageText(e.target.value)} 
                placeholder="Try: 'confirm my order', 'Hello', or 'yes'..." 
                className="flex-1 bg-background min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!messageText.trim() || !customerPhone.trim() || sendMut.isPending) return;
                    sendMut.mutate();
                  }
                }}
              />
              <Button 
                onClick={() => sendMut.mutate()} 
                disabled={!messageText.trim() || !customerPhone.trim() || sendMut.isPending} 
                className="bg-gradient-primary self-end"
              >
                {sendMut.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {sendMut.error && (
              <p className="text-xs text-destructive mt-1">
                Error: {sendMut.error.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};