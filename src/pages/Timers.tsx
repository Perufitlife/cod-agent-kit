import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Timer, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const Timers = () => {
  const { data: timers, isLoading } = useQuery({
    queryKey: ['timers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const formatTimeRemaining = (fireAt: string) => {
    const now = new Date();
    const fireTime = new Date(fireAt);
    const diff = fireTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Overdue";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'fired':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout currentPage="timers">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Timers
            </h1>
            <p className="text-muted-foreground">
              Monitor scheduled actions and automated timers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {timers?.filter(t => t.status === 'scheduled').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Timers</p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {timers?.filter(t => t.status === 'fired').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {timers?.filter(t => {
                      if (t.status !== 'scheduled') return false;
                      return new Date(t.fire_at) < new Date();
                    }).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              All Timers
            </CardTitle>
            <CardDescription>Scheduled and completed timers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading timers...</div>
            ) : timers && timers.length > 0 ? (
              <div className="space-y-4">
                {timers.map((timer) => (
                  <div key={timer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(timer.status)}
                      <div>
                        <p className="font-medium">{timer.purpose}</p>
                        <p className="text-sm text-muted-foreground">
                          Fire at: {new Date(timer.fire_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(timer.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {timer.status === 'scheduled' && (
                        <span className="text-sm text-muted-foreground">
                          {formatTimeRemaining(timer.fire_at)}
                        </span>
                      )}
                      <Badge 
                        variant={
                          timer.status === 'fired' ? 'default' : 
                          timer.status === 'scheduled' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {timer.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No timers found</p>
                <p className="text-xs mt-1">Timers will appear here when workflows create scheduled actions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Timers;