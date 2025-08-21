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
  action_type: "wait" | "send_message" | "update_order" | "check_condition" | "ai_agent_decision" | "end_workflow";
  config: Record<string, any>;
  conditions?: Record<string, any>;
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
        
      case "check_condition":
        return (
          <div className="space-y-3 bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <Label className="font-semibold text-yellow-800">Verificar Condición</Label>
            </div>
            <div className="space-y-2">
              <Label>¿Qué verificar?</Label>
              <Select
                value={action.config.condition_type || "has_tag"}
                onValueChange={(value) => updateAction(action.id, {
                  config: { ...action.config, condition_type: value }
                })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="has_tag">Tiene Etiqueta</SelectItem>
                </SelectContent>
              </Select>
              
              <Label>Nombre de la etiqueta</Label>
              <Input
                value={action.config.tag_name || "order_linked"}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, tag_name: e.target.value }
                })}
                placeholder="order_linked"
                className="bg-white"
              />
              <p className="text-xs text-yellow-700">Si la orden tiene esta etiqueta, el flujo terminará aquí</p>
            </div>
          </div>
        );

      case "ai_agent_decision":
        return (
          <div className="space-y-3 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <Label className="font-semibold text-purple-800">Decisión con IA</Label>
            </div>
            <div className="bg-white/70 p-3 rounded border">
              <p className="text-sm text-purple-700 mb-2">
                La IA analizará la información de la orden y decidirá si confirmarla o rechazarla
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-100 p-2 rounded">
                  <strong>✓ Confirmar:</strong> Si toda la info está completa
                </div>
                <div className="bg-red-100 p-2 rounded">
                  <strong>✗ Rechazar:</strong> Si falta información crítica
                </div>
              </div>
            </div>
          </div>
        );

      case "end_workflow":
        return (
          <div className="space-y-3 bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <Label className="font-semibold text-red-800">Terminar Flujo</Label>
            </div>
            <Label>Razón</Label>
            <Input
              value={action.config.reason || ""}
              onChange={(e) => updateAction(action.id, {
                config: { ...action.config, reason: e.target.value }
              })}
              placeholder="¿Por qué termina aquí el flujo?"
              className="bg-white"
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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">🚀 Flujo de Procesamiento de Órdenes</h3>
                <p className="text-sm text-blue-700">Usa el template inteligente o crea acciones personalizadas</p>
              </div>
              <Button 
                onClick={() => {
                  const template = workflowTemplates.order_processing;
                  setFormData(prev => ({
                    ...prev,
                    name: template.name,
                    description: template.description,
                    actions: template.actions,
                    triggers: template.triggers
                  }));
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Usar Template IA
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">Acciones del Flujo</h4>
            <Button onClick={addAction} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Acción
            </Button>
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
                          <SelectItem value="wait">⏱️ Esperar</SelectItem>
                          <SelectItem value="send_message">💬 Enviar Mensaje</SelectItem>
                          <SelectItem value="update_order">📋 Actualizar Orden</SelectItem>
                          <SelectItem value="check_condition">❓ Verificar Condición</SelectItem>
                          <SelectItem value="ai_agent_decision">🤖 Decisión IA</SelectItem>
                          <SelectItem value="end_workflow">🛑 Terminar Flujo</SelectItem>
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