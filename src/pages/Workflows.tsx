import { useState } from "react";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Workflow, Play, Pause, Plus, Settings, Edit, Trash2, Power } from "lucide-react";
import { WorkflowEditor } from "@/components/workflows/WorkflowEditor";
import { WorkflowFlowViewer } from "@/components/workflows/WorkflowFlowViewer";
import { useToast } from "@/hooks/use-toast";

type WorkflowDefinition = {
  id?: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at?: string;
  actions?: any[];
};

const Workflows = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDefinition | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflow_definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select(`
          *,
          workflow_versions!workflow_versions_workflow_id_fkey (
            id,
            version,
            definition,
            is_published
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: workflowRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['workflow_runs_with_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_runs')
        .select(`
          *,
          orders (
            system_order_id,
            external_order_id,
            status,
            created_at
          )
        `)
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000, // Actualización en tiempo real cada 3 segundos
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflow: any) => {
      const tenant_id = "00000000-0000-0000-0000-000000000001";
      
      if (workflow.id) {
        // Update existing workflow
        const { error } = await supabase
          .from('workflow_definitions')
          .update({
            name: workflow.name,
            description: workflow.description,
            is_active: workflow.is_active
          })
          .eq('id', workflow.id);
        if (error) throw error;
      } else {
        // Create new workflow
        const { data: newWorkflow, error } = await supabase
          .from('workflow_definitions')
          .insert({
            tenant_id,
            name: workflow.name,
            description: workflow.description,
            is_active: workflow.is_active,
            trigger_conditions: {}
          })
          .select()
          .single();
        
        if (error) throw error;

        // Create workflow version
        const { error: versionError } = await supabase
          .from('workflow_versions')
          .insert({
            workflow_id: newWorkflow.id,
            version: 1,
            definition: { actions: workflow.actions || [] },
            is_published: workflow.is_active
          });
        
        if (versionError) throw versionError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow_definitions'] });
      setShowEditor(false);
      setEditingWorkflow(null);
      toast({ title: "Workflow saved successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to save workflow", description: error.message, variant: "destructive" });
    }
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('workflow_definitions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow_definitions'] });
      toast({ title: "Workflow status updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update workflow", description: error.message, variant: "destructive" });
    }
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workflow_definitions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow_definitions'] });
      toast({ title: "Workflow deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete workflow", description: error.message, variant: "destructive" });
    }
  });

  if (showEditor) {
    return (
      <DashboardLayout currentPage="workflows">
        <div className="p-6 space-y-6 min-h-screen bg-background">
          <WorkflowEditor
            workflow={editingWorkflow ? { ...editingWorkflow, actions: editingWorkflow.actions || [] } : undefined}
            onSave={(workflow) => saveWorkflowMutation.mutate(workflow)}
            onCancel={() => {
              setShowEditor(false);
              setEditingWorkflow(null);
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="workflows">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              🤖 Flujos Automatizados
            </h1>
            <p className="text-muted-foreground">
              Gestiona el procesamiento inteligente de órdenes con IA
            </p>
          </div>
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 shadow-lg"
            onClick={() => setShowEditor(true)}
          >
            <Plus className="w-4 h-4" />
            Crear Flujo
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
                    <div key={workflow.id} className="space-y-4 p-4 border rounded-lg bg-card">
                      {/* Workflow Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground">{workflow.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(workflow.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                            {workflow.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleWorkflowMutation.mutate({
                              id: workflow.id,
                              is_active: !workflow.is_active
                            })}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const publishedVersion = workflow.workflow_versions?.find(v => v.is_published);
                              const definition = publishedVersion?.definition as any;
                              setEditingWorkflow({ 
                                ...workflow, 
                                actions: definition?.actions || [] 
                              });
                              setShowEditor(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this workflow?')) {
                                deleteWorkflowMutation.mutate(workflow.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Trigger Information */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          Triggers
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {workflow.trigger_conditions && Object.keys(workflow.trigger_conditions).length > 0 ? (
                            Object.entries(workflow.trigger_conditions).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              New Order (status: pending)
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Visual Flow Preview */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Workflow Flow</h4>
                        <div className="h-32">
                          <WorkflowFlowViewer 
                            workflowDefinition={workflow.workflow_versions?.find(v => v.is_published)?.definition as any}
                          />
                        </div>
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
                    <div key={run.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">
                              Order: {run.orders?.system_order_id || 'No Order'}
                            </p>
                            <Badge 
                              variant={
                                run.status === 'completed' ? 'default' : 
                                run.status === 'failed' ? 'destructive' : 
                                run.status === 'paused' ? 'outline' :
                                'secondary'
                              }
                            >
                              {run.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Current State: <span className="font-medium text-foreground">{run.current_state}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">
                            Order Status: <span className="font-medium">{run.orders?.status || 'Unknown'}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(run.started_at).toLocaleString()}
                          </p>
                          {run.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Completed: {new Date(run.completed_at).toLocaleString()}
                            </p>
                          )}
                          {run.error_message && (
                            <p className="text-xs text-destructive mt-1">
                              Error: {run.error_message}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Run ID</p>
                          <p className="text-xs font-mono">#{run.id.slice(-8)}</p>
                        </div>
                      </div>
                      
                      {/* Live Status Indicator */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <div className={`w-2 h-2 rounded-full ${
                          run.status === 'running' ? 'bg-green-500 animate-pulse' :
                          run.status === 'paused' ? 'bg-yellow-500' :
                          run.status === 'completed' ? 'bg-blue-500' :
                          run.status === 'failed' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`}></div>
                        <p className="text-xs text-muted-foreground">
                          {run.status === 'running' ? 'Workflow is actively running' :
                           run.status === 'paused' ? 'Workflow paused - waiting for action' :
                           run.status === 'completed' ? 'Workflow completed successfully' :
                           run.status === 'failed' ? 'Workflow failed - check error message' :
                           'Unknown status'}
                        </p>
                      </div>
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