import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Package, Users, MessageSquare, DollarSign, Zap, Target } from "lucide-react";

const statsData = [
  {
    title: "Total Orders",
    value: "2,847",
    change: "+12.5%",
    changeType: "increase" as const,
    icon: Package,
    description: "vs last month",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    glowColor: "shadow-blue-500/25"
  },
  {
    title: "Revenue",
    value: "$48,392",
    change: "+8.2%",
    changeType: "increase" as const,
    icon: DollarSign,
    description: "vs last month",
    color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    glowColor: "shadow-emerald-500/25"
  },
  {
    title: "Active Conversations",
    value: "156",
    change: "-3.1%",
    changeType: "decrease" as const,
    icon: MessageSquare,
    description: "vs yesterday",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    glowColor: "shadow-purple-500/25"
  },
  {
    title: "Conversion Rate",
    value: "94.2%",
    change: "+2.4%",
    changeType: "increase" as const,
    icon: Target,
    description: "vs last week",
    color: "bg-gradient-to-br from-amber-500 to-amber-600",
    glowColor: "shadow-amber-500/25"
  },
  {
    title: "AI Response Time",
    value: "1.2s",
    change: "-15.3%",
    changeType: "increase" as const,
    icon: Zap,
    description: "vs last hour",
    color: "bg-gradient-to-br from-rose-500 to-rose-600",
    glowColor: "shadow-rose-500/25"
  },
  {
    title: "Active Users",
    value: "8,429",
    change: "+18.7%",
    changeType: "increase" as const,
    icon: Users,
    description: "vs last month",
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    glowColor: "shadow-indigo-500/25"
  }
];

export const StatsCards = () => {
  console.log("StatsCards rendering");
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsData.map((stat, index) => (
        <Card key={stat.title} className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:shadow-strong transition-all duration-500 hover:scale-[1.02] animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
          {/* Animated background gradient */}
          <div className={`absolute inset-0 ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
          
          {/* Glow effect */}
          <div className={`absolute -inset-1 ${stat.color} rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}></div>
          
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${stat.color} ${stat.glowColor} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={stat.changeType === "increase" ? "default" : "secondary"} 
                    className={`text-xs font-semibold px-2 py-1 ${
                      stat.changeType === "increase" 
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" 
                        : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {stat.changeType === "increase" ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {stat.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {stat.description}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Subtle pattern overlay */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="w-full h-full bg-gradient-to-br from-transparent to-foreground rounded-bl-full"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};