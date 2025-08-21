import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Workflow, Play, Pause, Plus, Settings } from "lucide-react";

const Workflows = () => {
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflow_definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: workflowRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['workflow_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <DashboardLayout currentPage="workflows">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Workflows
            </h1>
            <p className="text-muted-foreground">
              Design and manage automated workflows
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflow Definitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5" />
                Workflow Definitions
              </CardTitle>
              <CardDescription>Manage your automated workflows</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading workflows...</div>
              ) : workflows && workflows.length > 0 ? (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No workflows configured</p>
                  <p className="text-xs mt-1">Create your first workflow to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Workflow Runs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Recent Runs
              </CardTitle>
              <CardDescription>Latest workflow executions</CardDescription>
            </CardHeader>
            <CardContent>
              {runsLoading ? (
                <div className="text-center py-4">Loading runs...</div>
              ) : workflowRuns && workflowRuns.length > 0 ? (
                <div className="space-y-4">
                  {workflowRuns.map((run) => (
                    <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Run #{run.id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          State: {run.current_state}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(run.started_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          run.status === 'completed' ? 'default' : 
                          run.status === 'failed' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {run.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No workflow runs yet</p>
                  <p className="text-xs mt-1">Runs will appear here when workflows execute</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Workflows;