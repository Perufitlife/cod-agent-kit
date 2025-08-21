import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Play, ArrowDown, Settings, Sparkles } from "lucide-react";
import { WorkflowTriggerEditor } from "./WorkflowTriggerEditor";
import { WorkflowFlowViewer } from "./WorkflowFlowViewer";
import { workflowTemplates } from "./WorkflowTemplates";

export type WorkflowAction = {
  id: string;
  sequence_order: number;
  action_type: "wait" | "send_message" | "update_order" | "create_timer" | "check_condition" | "ai_agent_decision" | "branch" | "end_workflow";
  config: Record<string, any>;
  conditions?: Record<string, any>;
  outputs?: { [key: string]: string }; // For branching actions like conditions
};

export type WorkflowDefinition = {
  id?: string;
  name: string;
  description: string;
  is_active: boolean;
  actions: WorkflowAction[];
  triggers?: any[];
};

interface WorkflowEditorProps {
  workflow?: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => void;
  onCancel: () => void;
}

export const WorkflowEditor = ({ workflow, onSave, onCancel }: WorkflowEditorProps) => {
  const [formData, setFormData] = useState<WorkflowDefinition>(
    workflow || {
      name: "",
      description: "",
      is_active: true,
      actions: [],
      triggers: []
    }
  );

  const addAction = () => {
    const newAction: WorkflowAction = {
      id: crypto.randomUUID(),
      sequence_order: formData.actions.length + 1,
      action_type: "wait",
      config: {},
    };
    
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = (actionId: string, updates: Partial<WorkflowAction>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map(action =>
        action.id === actionId ? { ...action, ...updates } : action
      )
    }));
  };

  const removeAction = (actionId: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter(action => action.id !== actionId)
        .map((action, index) => ({ ...action, sequence_order: index + 1 }))
    }));
  };

  const renderActionConfig = (action: WorkflowAction) => {
    switch (action.action_type) {
      case "wait":
        return (
          <div className="space-y-2">
            <Label>Wait Duration (minutes)</Label>
            <Input
              type="number"
              value={action.config.duration || 1}
              onChange={(e) => updateAction(action.id, {
                config: { ...action.config, duration: parseInt(e.target.value) }
              })}
              placeholder="Duration in minutes"
            />
          </div>
        );
        
      case "send_message":
        return (
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Textarea
              value={action.config.message || ""}
              onChange={(e) => updateAction(action.id, {
                config: { ...action.config, message: e.target.value }
              })}
              placeholder="Enter message template..."
              rows={3}
            />
          </div>
        );
        
      case "update_order":
        return (
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select
              value={action.config.status || ""}
              onValueChange={(value) => updateAction(action.id, {
                config: { ...action.config, status: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
        
      case "create_timer":
        return (
          <div className="space-y-2">
            <Label>Timer Purpose</Label>
            <Input
              value={action.config.purpose || ""}
              onChange={(e) => updateAction(action.id, {
                config: { ...action.config, purpose: e.target.value }
              })}
              placeholder="Timer purpose..."
            />
            <Label>Delay (minutes)</Label>
            <Input
              type="number"
              value={action.config.delay || 60}
              onChange={(e) => updateAction(action.id, {
                config: { ...action.config, delay: parseInt(e.target.value) }
              })}
              placeholder="Delay in minutes"
            />
          </div>
        );

      case "check_condition":
        return (
          <div className="space-y-2">
            <Label>Condition Type</Label>
            <Select
              value={action.config.condition_type || ""}
              onValueChange={(value) => updateAction(action.id, {
                config: { ...action.config, condition_type: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="has_tag">Has Tag</SelectItem>
                <SelectItem value="order_status">Order Status</SelectItem>
                <SelectItem value="time_elapsed">Time Elapsed</SelectItem>
                <SelectItem value="custom_field">Custom Field</SelectItem>
              </SelectContent>
            </Select>
            
            {action.config.condition_type === "has_tag" && (
              <>
                <Label>Tag Name</Label>
                <Input
                  value={action.config.tag_name || ""}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, tag_name: e.target.value }
                  })}
                  placeholder="e.g., order_linked"
                />
              </>
            )}
            
            {action.config.condition_type === "order_status" && (
              <>
                <Label>Expected Status</Label>
                <Select
                  value={action.config.expected_status || ""}
                  onValueChange={(value) => updateAction(action.id, {
                    config: { ...action.config, expected_status: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        );

      case "ai_agent_decision":
        return (
          <div className="space-y-2">
            <Label>AI Prompt</Label>
            <Textarea
              value={action.config.prompt || ""}
              onChange={(e) => updateAction(action.id, {
                config: { ...action.config, prompt: e.target.value }
              })}
              placeholder="Describe what the AI should analyze and decide..."
              rows={4}
            />
            <Label>Decision Options</Label>
            <div className="space-y-2">
              <Input
                value={action.config.option_1 || ""}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, option_1: e.target.value }
                })}
                placeholder="Option 1 (e.g., confirm_order)"
              />
              <Input
                value={action.config.option_2 || ""}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, option_2: e.target.value }
                })}
                placeholder="Option 2 (e.g., reject_order)"
              />
            </div>
          </div>
        );

      case "branch":
        return (
          <div className="space-y-2">
            <Label>Branch Description</Label>
            <Input
              value={action.config.description || ""}
              onChange={(e) => updateAction(action.id, {
                config: { ...action.config, description: e.target.value }
              })}
              placeholder="Describe this branch point..."
            />
          </div>
        );

      case "end_workflow":
        return (
          <div className="space-y-2">
            <Label>End Reason</Label>
            <Input
              value={action.config.reason || ""}
              onChange={(e) => updateAction(action.id, {
                config: { ...action.config, reason: e.target.value }
              })}
              placeholder="Why does the workflow end here?"
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {workflow ? "Edit Workflow" : "Create New Workflow"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter workflow name..."
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this workflow does..."
              rows={2}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>

        {/* Triggers */}
        <WorkflowTriggerEditor
          triggers={formData.triggers}
          onTriggersChange={(triggers) => setFormData(prev => ({ ...prev, triggers }))}
        />

        {/* Visual Flow Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Workflow Flow Preview</h3>
          <WorkflowFlowViewer 
            workflowDefinition={{ actions: formData.actions }}
            isEditable={false}
          />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Workflow Actions</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  const template = workflowTemplates.order_processing;
                  setFormData(prev => ({
                    ...prev,
                    name: prev.name || template.name,
                    description: prev.description || template.description,
                    actions: template.actions,
                    triggers: template.triggers
                  }));
                }}
                variant="outline" 
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use AI Template
              </Button>
              <Button onClick={addAction} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {formData.actions.map((action, index) => (
              <Card key={action.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step {action.sequence_order}</Badge>
                      <Select
                        value={action.action_type}
                        onValueChange={(value) => updateAction(action.id, {
                          action_type: value as WorkflowAction["action_type"],
                          config: {} // Reset config when type changes
                        })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wait">Wait / Delay</SelectItem>
                          <SelectItem value="send_message">Send Message</SelectItem>
                          <SelectItem value="update_order">Update Order</SelectItem>
                          <SelectItem value="create_timer">Create Timer</SelectItem>
                          <SelectItem value="check_condition">Check Condition</SelectItem>
                          <SelectItem value="ai_agent_decision">AI Agent Decision</SelectItem>
                          <SelectItem value="branch">Branch Point</SelectItem>
                          <SelectItem value="end_workflow">End Workflow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => removeAction(action.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {renderActionConfig(action)}

                  {index < formData.actions.length - 1 && (
                    <div className="flex justify-center">
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {formData.actions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No actions yet</p>
                <p className="text-sm">Add actions to define your workflow</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSave(formData)} 
            disabled={!formData.name.trim()}
            className="bg-gradient-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Workflow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};