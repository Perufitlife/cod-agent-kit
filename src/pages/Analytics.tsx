import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { StatsCards } from "@/components/crm/StatsCards";
import { AdvancedCharts } from "@/components/analytics/AdvancedCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, MessageCircle, Package } from "lucide-react";

const Analytics = () => {
  const { data: orderStats, isLoading: ordersLoading } = useQuery({
    queryKey: ['order-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status, created_at');
      
      if (error) throw error;
      
      const today = new Date();
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentOrders = data.filter(order => new Date(order.created_at) >= last7Days);
      const monthlyOrders = data.filter(order => new Date(order.created_at) >= last30Days);
      
      return {
        total: data.length,
        weekly: recentOrders.length,
        monthly: monthlyOrders.length,
        byStatus: data.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    }
  });

  const { data: messageStats, isLoading: messagesLoading } = useQuery({
    queryKey: ['message-analytics'],
    queryFn: async () => {
      const { data: inbox, error: inboxError } = await supabase
        .from('messages_inbox')
        .select('created_at');
      
      const { data: outbox, error: outboxError } = await supabase
        .from('messages_outbox')
        .select('created_at, status');
      
      if (inboxError || outboxError) throw inboxError || outboxError;
      
      const today = new Date();
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentInbox = inbox?.filter(msg => new Date(msg.created_at) >= last7Days) || [];
      const recentOutbox = outbox?.filter(msg => new Date(msg.created_at) >= last7Days) || [];
      
      return {
        totalInbound: inbox?.length || 0,
        totalOutbound: outbox?.length || 0,
        weeklyInbound: recentInbox.length,
        weeklyOutbound: recentOutbox.length,
        outboxByStatus: (outbox || []).reduce((acc, msg) => {
          acc[msg.status] = (acc[msg.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    }
  });

  return (
    <DashboardLayout currentPage="analytics">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Analytics
            </h1>
            <p className="text-muted-foreground">
              Track performance metrics and insights
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Key Metrics</h2>
          <StatsCards />
        </div>

        {/* Order Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Analytics
              </CardTitle>
              <CardDescription>Order volume and status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-4">Loading order data...</div>
              ) : orderStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{orderStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{orderStats.monthly}</p>
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{orderStats.weekly}</p>
                      <p className="text-xs text-muted-foreground">This Week</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Orders by Status</p>
                    <div className="space-y-2">
                      {Object.entries(orderStats.byStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{status}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No order data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Message Analytics
              </CardTitle>
              <CardDescription>Conversation volume and response metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="text-center py-4">Loading message data...</div>
              ) : messageStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{messageStats.totalInbound}</p>
                      <p className="text-xs text-muted-foreground">Inbound Messages</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{messageStats.totalOutbound}</p>
                      <p className="text-xs text-muted-foreground">Outbound Messages</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{messageStats.weeklyInbound}</p>
                      <p className="text-xs text-muted-foreground">Inbound (7d)</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{messageStats.weeklyOutbound}</p>
                      <p className="text-xs text-muted-foreground">Outbound (7d)</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Outbound Message Status</p>
                    <div className="space-y-2">
                      {Object.entries(messageStats.outboxByStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{status}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No message data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Charts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Advanced Analytics</h2>
          <AdvancedCharts />
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Overview
            </CardTitle>
            <CardDescription>System performance and AI agent efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {messageStats && messageStats.totalOutbound > 0 
                    ? Math.round((messageStats.outboxByStatus.sent || 0) / messageStats.totalOutbound * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Message Delivery Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {orderStats && orderStats.total > 0
                    ? Math.round((orderStats.byStatus.confirmed || 0) / orderStats.total * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Order Confirmation Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">~2m</p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">AI Agent Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;