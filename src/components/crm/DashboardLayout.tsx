import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  Settings, 
  Workflow,
  Timer,
  BarChart3,
  Users
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
  { name: "Team", href: "/team", icon: Users, page: "team" },
  { name: "Settings", href: "/settings", icon: Settings, page: "settings" },
];

export const DashboardLayout = ({ children, currentPage = "dashboard" }: DashboardLayoutProps) => {
  console.log("DashboardLayout rendering with page:", currentPage);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-medium border-r border-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border bg-gradient-primary">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Order CRM</h1>
                <p className="text-xs text-white/80">AI-Powered</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">AI Agent Active</p>
                <p className="text-xs text-muted-foreground truncate">Processing messages...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        <main className="w-full min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};