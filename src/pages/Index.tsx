import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { StatsCards } from "@/components/crm/StatsCards";
import { OrdersTable } from "@/components/crm/OrdersTable";
import { MessageSandbox } from "@/components/crm/MessageSandbox";
import { Sparkles, TrendingUp } from "lucide-react";

const Index = () => {
  console.log("Index page rendering");
  
  return (
    <DashboardLayout currentPage="dashboard">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
        {/* Hero Header with Glass Effect */}
        <div className="relative overflow-hidden bg-gradient-primary p-8 mb-8">
          <div className="absolute inset-0 bg-gradient-animated opacity-30"></div>
          <div className="relative glass rounded-2xl p-6 backdrop-blur-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-white animate-pulse-glow" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight animate-fade-in">
                      AI Order CRM
                    </h1>
                    <p className="text-white/90 text-lg font-medium">
                      Multi-tenant Intelligence Platform
                    </p>
                  </div>
                </div>
                <p className="text-white/80 text-lg max-w-2xl">
                  Revolutionize your e-commerce operations with AI-powered automation, 
                  intelligent conversations, and predictive analytics.
                </p>
              </div>
              
              <div className="glass rounded-xl p-6 bg-white/10 backdrop-blur-sm hover-lift">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/20 rounded-full">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">System Status</p>
                    <p className="text-2xl font-bold text-white">All Systems Operational</p>
                    <p className="text-white/60 text-xs">AI Agent Active • 99.9% Uptime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-8">
          {/* Enhanced Stats Cards */}
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
              Key Performance Metrics
            </h2>
            <StatsCards />
          </div>

          {/* Main Content Grid with Enhanced Styling */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Orders Table - Enhanced */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  Recent Orders
                </h3>
                <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full border border-success/20">
                  Live Updates
                </div>
              </div>
              <div className="card-enhanced">
                <OrdersTable />
              </div>
            </div>

            {/* Message Sandbox - Enhanced */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <div className="w-1 h-6 bg-accent rounded-full"></div>
                  AI Assistant
                </h3>
                <div className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
                  Beta
                </div>
              </div>
              <div className="card-enhanced">
                <MessageSandbox />
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="text-center py-12 mt-16 border-t border-gradient-to-r from-transparent via-border to-transparent">
            <div className="glass rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-muted-foreground font-medium">
                Order CRM AI Platform
              </p>
              <p className="text-sm text-muted-foreground/80 mt-2">
                Powered by Advanced Machine Learning & Multi-tenant Architecture
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;