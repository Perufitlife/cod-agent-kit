import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

const NotificationTest = () => {
  const [phone, setPhone] = useState("+1234567890");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const sendMessageMut = useMutation({
    mutationFn: async ({ phone, message }: { phone: string; message: string }) => {
      console.log("🚀 Sending test message:", { phone, message });
      const { data, error } = await supabase.functions.invoke('sandbox_message', {
        body: { 
          customer_phone: phone, 
          message_text: message
        }
      });
      
      if (error) {
        console.error("❌ sandbox_message failed:", error);
        throw error;
      }
      
      console.log("✅ Message sent successfully:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Test message sent successfully. Check notifications!",
      });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const createDemoOrderMut = useMutation({
    mutationFn: async () => {
      console.log("🚀 Creating demo order...");
      const { data, error } = await supabase.functions.invoke('create_order', {
        body: {
          data: {
            customer_name: "Test Customer",
            product: "Demo Product",
            total: 99.99
          },
          source: "demo_test",
          external_order_id: `DEMO-${Date.now()}`
        }
      });
      
      if (error) {
        console.error("❌ create_order failed:", error);
        throw error;
      }
      
      console.log("✅ Demo order created:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Demo Order Created",
        description: "Check notifications for the new order alert!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: `Failed to create order: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return (
    <DashboardLayout currentPage="conversations">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Notification Testing
            </h1>
            <p className="text-muted-foreground">
              Test the notification system by sending messages and creating orders
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Message Testing */}
          <Card>
            <CardHeader>
              <CardTitle>Test Message Notifications</CardTitle>
              <CardDescription>
                Send a message to trigger inbox notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Customer Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your test message..."
                />
              </div>
              <Button 
                onClick={() => sendMessageMut.mutate({ phone, message })}
                disabled={sendMessageMut.isPending || !message.trim()}
                className="w-full"
              >
                {sendMessageMut.isPending ? "Sending..." : "Send Test Message"}
              </Button>
            </CardContent>
          </Card>

          {/* Order Testing */}
          <Card>
            <CardHeader>
              <CardTitle>Test Order Notifications</CardTitle>
              <CardDescription>
                Create a demo order to trigger order notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Demo Order Details:</p>
                <ul className="text-sm space-y-1">
                  <li>• Customer: Test Customer</li>
                  <li>• Product: Demo Product</li>
                  <li>• Total: $99.99</li>
                  <li>• Source: demo_test</li>
                </ul>
              </div>
              <Button 
                onClick={() => createDemoOrderMut.mutate()}
                disabled={createDemoOrderMut.isPending}
                className="w-full"
                variant="outline"
              >
                {createDemoOrderMut.isPending ? "Creating..." : "Create Demo Order"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>How to test notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Message Test:</strong> Enter a message and send it. You should see a notification appear in the top-right bell icon.
              </div>
              <div>
                <strong>2. Order Test:</strong> Click "Create Demo Order" to generate a new order notification.
              </div>
              <div>
                <strong>3. Check Notifications:</strong> Click the bell icon (🔔) in the top navigation to see all notifications.
              </div>
              <div>
                <strong>4. Real-time Updates:</strong> The notifications should appear immediately without page refresh.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationTest;