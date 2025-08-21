import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, MessageSquare, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statsData = [
  {
    title: "Total Orders",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: Package,
    description: "Active orders in system",
  },
  {
    title: "Pending Confirmation", 
    value: "23",
    change: "+2",
    changeType: "neutral" as const,
    icon: Clock,
    description: "Awaiting customer response",
  },
  {
    title: "Active Conversations",
    value: "156",
    change: "+8.2%", 
    changeType: "positive" as const,
    icon: MessageSquare,
    description: "AI agent handling",
  },
  {
    title: "Needs Attention",
    value: "7",
    change: "-3",
    changeType: "positive" as const,
    icon: AlertTriangle,
    description: "Require manual review",
  },
];

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="shadow-soft hover:shadow-medium transition-all duration-200 border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    stat.changeType === "positive"
                      ? "border-success/20 bg-success/10 text-success"
                      : stat.changeType === "neutral"
                      ? "border-muted-foreground/20 bg-muted text-muted-foreground"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  }
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};