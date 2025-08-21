import { useState, useEffect } from "react";
import { Bell, Check, X, AlertCircle, MessageSquare, Package, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  type: 'order' | 'message' | 'system' | 'workflow';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
};

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔔 NotificationCenter: Setting up realtime subscriptions...');
    
    // Subscribe to real-time updates
    const orderSubscription = supabase
      .channel('order-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🚨 NEW ORDER detected:', payload);
          
          const newNotification: Notification = {
            id: crypto.randomUUID(),
            type: 'order',
            title: 'New Order Received',
            message: `Order #${payload.new.system_order_id} has been created`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'high',
            data: payload.new
          };
          
          console.log('📩 Adding new order notification:', newNotification);
          setNotifications(prev => [newNotification, ...prev]);
          
          toast({
            title: "New Order",
            description: `Order #${payload.new.system_order_id} received`,
          });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📝 ORDER UPDATE detected:', payload);
          
          if (payload.old.status !== payload.new.status) {
            const newNotification: Notification = {
              id: crypto.randomUUID(),
              type: 'order',
              title: 'Order Status Updated',
              message: `Order #${payload.new.system_order_id} is now ${payload.new.status}`,
              timestamp: new Date().toISOString(),
              read: false,
              priority: 'medium',
              data: payload.new
            };
            
            console.log('📩 Adding order update notification:', newNotification);
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Orders subscription status:', status);
      });

    const messageSubscription = supabase
      .channel('message-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages_inbox' },
        (payload) => {
          console.log('📨 NEW MESSAGE detected:', payload);
          
          const newNotification: Notification = {
            id: crypto.randomUUID(),
            type: 'message',
            title: 'New Message Received',
            message: `Message from ${payload.new.customer_phone}`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'medium',
            data: payload.new
          };
          
          console.log('📩 Adding message notification:', newNotification);
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('📡 Messages subscription status:', status);
      });

    const timerSubscription = supabase
      .channel('timer-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'timers' },
        (payload) => {
          console.log('⏰ TIMER UPDATE detected:', payload);
          
          if (payload.new.status === 'fired' && payload.old.status === 'scheduled') {
            const newNotification: Notification = {
              id: crypto.randomUUID(),
              type: 'workflow',
              title: 'Timer Executed',
              message: `Timer for ${payload.new.purpose} has been executed`,
              timestamp: new Date().toISOString(),
              read: false,
              priority: 'low',
              data: payload.new
            };
            
            console.log('📩 Adding timer notification:', newNotification);
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Timers subscription status:', status);
      });

    return () => {
      orderSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      timerSubscription.unsubscribe();
    };
  }, [toast]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'workflow': return <Settings className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="fixed top-16 right-4 w-80 md:w-96 max-h-[32rem] z-[9999] shadow-xl bg-background/95 backdrop-blur-sm border border-border">
          <CardHeader className="pb-2 px-4 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7 px-2">
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7 px-2">
                  Clear all
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors duration-200 ${
                        !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full flex-shrink-0 ${
                          notification.priority === 'high' ? 'bg-destructive/20 text-destructive' : 
                          notification.priority === 'medium' ? 'bg-orange-500/20 text-orange-600' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium leading-tight">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};