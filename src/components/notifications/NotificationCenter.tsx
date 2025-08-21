import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, AlertCircle, MessageSquare, Package, Settings, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { createPortal } from "react-dom";

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
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  // Calculate button position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  // Close on escape key or outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

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
      {/* Notification Bell Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-white/10 transition-colors text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-red-500 text-white border-2 border-white/20 animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Render dropdown in portal to escape sidebar context */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[200]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div 
            className="fixed z-[201] w-80 sm:w-96 animate-scale-in"
            style={{
              top: `${buttonPosition.top}px`,
              right: `${buttonPosition.right}px`,
            }}
          >
            <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={markAllAsRead}
                          className="text-xs h-7 px-2 hover:bg-muted/50"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Mark all read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAll}
                        className="text-xs h-7 px-2 hover:bg-muted/50 text-muted-foreground"
                      >
                        Clear all
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 hover:bg-muted/50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/30 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground/80 mb-1">No notifications yet</p>
                    <p className="text-xs text-muted-foreground">We'll let you know when something important happens</p>
                  </div>
                ) : (
                  <div className="p-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`group relative p-3 mx-1 my-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/40 ${
                          !notification.read 
                            ? 'bg-primary/5 border-l-2 border-l-primary shadow-sm' 
                            : 'hover:shadow-sm'
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            notification.priority === 'high' 
                              ? 'bg-red-500/15 text-red-600' 
                              : notification.priority === 'medium' 
                              ? 'bg-amber-500/15 text-amber-600' 
                              : 'bg-blue-500/15 text-blue-600'
                          }`}>
                            {getIcon(notification.type)}
                            {!notification.read && (
                              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border border-background" />
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`text-sm leading-tight ${
                                !notification.read ? 'font-semibold' : 'font-medium'
                              }`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-muted-foreground/70 flex-shrink-0">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};