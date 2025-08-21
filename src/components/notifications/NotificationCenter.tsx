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
    // Subscribe to real-time updates
    const orderSubscription = supabase
      .channel('order-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
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
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe();

    const messageSubscription = supabase
      .channel('message-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages_inbox' },
        (payload) => {
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
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe();

    const timerSubscription = supabase
      .channel('timer-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'timers' },
        (payload) => {
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
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe();

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
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 z-50 shadow-strong">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <X className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-full bg-${getPriorityColor(notification.priority)}/20`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};