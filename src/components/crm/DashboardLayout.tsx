import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  Settings, 
  Workflow,
  Timer,
  BarChart3,
  Users,
  Plug,
  Sparkles
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, page: "dashboard" },
  { name: "Orders", href: "/orders", icon: Package, page: "orders" },
  { name: "Conversations", href: "/conversations", icon: MessageSquare, page: "conversations" },
  { name: "Workflows", href: "/workflows", icon: Workflow, page: "workflows" },
  { name: "Timers", href: "/timers", icon: Timer, page: "timers" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, page: "analytics" },
  { name: "Integrations", href: "/integrations", icon: Plug, page: "integrations" },
  { name: "Team", href: "/team", icon: Users, page: "team" },
  { name: "Settings", href: "/settings", icon: Settings, page: "settings" },
];

export const DashboardLayout = ({ children, currentPage = "dashboard" }: DashboardLayoutProps) => {
  console.log("DashboardLayout rendering with page:", currentPage);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Sidebar with Glass Effect */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar/95 backdrop-blur-xl shadow-strong border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          {/* Enhanced Logo Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-90"></div>
            <div className="relative flex items-center justify-between h-20 px-6 border-b border-white/10">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Sparkles className="w-6 h-6 text-white animate-pulse-glow" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Order CRM</h1>
                  <p className="text-xs text-white/80 font-medium">AI-Powered Platform</p>
                </div>
              </div>
              <NotificationCenter />
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-4 px-3">
              Navigation
            </div>
            {navigation.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg shadow-primary/25 scale-[1.02]"
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:scale-[1.01]"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-white rounded-r-full"></div>
                  )}
                  
                  {/* Icon with enhanced styling */}
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300",
                    isActive 
                      ? "bg-white/20 shadow-sm" 
                      : "bg-sidebar-accent/30 group-hover:bg-sidebar-accent group-hover:scale-110"
                  )}>
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                  </div>
                  
                  <span className="truncate">{item.name}</span>
                  
                  {/* Hover glow effect */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Enhanced Status Section */}
          <div className="px-6 py-4 border-t border-sidebar-border bg-sidebar-accent/30 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-success rounded-full animate-ping"></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sidebar-foreground">AI Agent Online</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">Processing 24 conversations...</p>
              </div>
              <div className="w-2 h-8 bg-gradient-to-t from-success via-success to-success/50 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Enhanced Spacing */}
      <div className="ml-72 min-h-screen">
        <main className="w-full min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};