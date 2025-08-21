import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Smartphone, Bot, User, Clock } from "lucide-react";

interface Message {
  id: string;
  type: "customer" | "agent";
  content: string;
  timestamp: string;
  phone?: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    type: "customer",
    content: "Hi, I want to confirm my order #SIS-2001",
    timestamp: "2024-01-21T10:30:00Z",
    phone: "+1234567890"
  },
  {
    id: "2", 
    type: "agent",
    content: "Hello Maria! I found your order SIS-2001 for delivery to 123 Main St. The total is $89.99 with delivery scheduled for Jan 22. Reply YES to confirm or let me know if you need any changes.",
    timestamp: "2024-01-21T10:30:15Z"
  },
  {
    id: "3",
    type: "customer", 
    content: "Yes, confirm the order please",
    timestamp: "2024-01-21T10:31:00Z",
    phone: "+1234567890"
  },
  {
    id: "4",
    type: "agent",
    content: "Perfect! Your order SIS-2001 has been confirmed. We'll update you when it ships. Thank you for your business!",
    timestamp: "2024-01-21T10:31:10Z"
  }
];

export const MessageSandbox = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [customerPhone, setCustomerPhone] = useState("+1234567890");
  const [messageText, setMessageText] = useState("");

  const sendMessage = () => {
    if (!messageText.trim() || !customerPhone.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "customer",
      content: messageText,
      timestamp: new Date().toISOString(),
      phone: customerPhone
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText("");

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent", 
        content: "Thanks for your message! Our AI agent is processing your request and will respond shortly.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 2000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <span>Message Sandbox</span>
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            WhatsApp Simulation
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages Area */}
        <div className="bg-muted/30 rounded-lg p-4 h-80 overflow-y-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "customer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.type === "customer"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground border border-border"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {message.type === "customer" ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                  <span className="text-xs opacity-75">
                    {message.type === "customer" ? "Customer" : "AI Agent"}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-end mt-2 space-x-1">
                  <Clock className="w-3 h-3 opacity-50" />
                  <span className="text-xs opacity-75">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Customer Phone Number
            </label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1234567890"
              className="bg-background"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Message Content
            </label>
            <div className="flex space-x-2">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 bg-background min-h-[60px]"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={!messageText.trim() || !customerPhone.trim()}
                className="bg-gradient-primary hover:opacity-90 self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};