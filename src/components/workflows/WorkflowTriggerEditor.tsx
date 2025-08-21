import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Zap } from "lucide-react";

interface TriggerCondition {
  id: string;
  event_type: string;
  conditions: Record<string, any>;
  is_active: boolean;
}

interface WorkflowTriggerEditorProps {
  triggers?: TriggerCondition[];
  onTriggersChange: (triggers: TriggerCondition[]) => void;
}

export const WorkflowTriggerEditor = ({ triggers = [], onTriggersChange }: WorkflowTriggerEditorProps) => {
  const [currentTriggers, setCurrentTriggers] = useState<TriggerCondition[]>(
    triggers.length > 0 ? triggers : [{
      id: crypto.randomUUID(),
      event_type: 'order_created',
      conditions: { status: 'pending' },
      is_active: true
    }]
  );

  const updateTriggers = (newTriggers: TriggerCondition[]) => {
    setCurrentTriggers(newTriggers);
    onTriggersChange(newTriggers);
  };

  const addTrigger = () => {
    const newTrigger: TriggerCondition = {
      id: crypto.randomUUID(),
      event_type: 'order_created',
      conditions: {},
      is_active: true
    };
    updateTriggers([...currentTriggers, newTrigger]);
  };

  const updateTrigger = (triggerId: string, updates: Partial<TriggerCondition>) => {
    const updated = currentTriggers.map(trigger =>
      trigger.id === triggerId ? { ...trigger, ...updates } : trigger
    );
    updateTriggers(updated);
  };

  const removeTrigger = (triggerId: string) => {
    updateTriggers(currentTriggers.filter(t => t.id !== triggerId));
  };

  const updateTriggerCondition = (triggerId: string, key: string, value: any) => {
    const trigger = currentTriggers.find(t => t.id === triggerId);
    if (trigger) {
      const newConditions = { ...trigger.conditions, [key]: value };
      updateTrigger(triggerId, { conditions: newConditions });
    }
  };

  const removeTriggerCondition = (triggerId: string, key: string) => {
    const trigger = currentTriggers.find(t => t.id === triggerId);
    if (trigger) {
      const { [key]: removed, ...newConditions } = trigger.conditions;
      updateTrigger(triggerId, { conditions: newConditions });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Workflow Triggers
          </CardTitle>
          <Button onClick={addTrigger} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Trigger
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTriggers.map((trigger, index) => (
          <Card key={trigger.id} className="border-l-4 border-l-orange-500">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Trigger {index + 1}</Badge>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={trigger.is_active}
                    onCheckedChange={(checked) => updateTrigger(trigger.id, { is_active: checked })}
                  />
                  {currentTriggers.length > 1 && (
                    <Button
                      onClick={() => removeTrigger(trigger.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={trigger.event_type}
                    onValueChange={(value) => updateTrigger(trigger.id, { event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_created">New Order Created</SelectItem>
                      <SelectItem value="order_updated">Order Updated</SelectItem>
                      <SelectItem value="order_status_changed">Order Status Changed</SelectItem>
                      <SelectItem value="timer_expired">Timer Expired</SelectItem>
                      <SelectItem value="message_received">Message Received</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status Filter</Label>
                  <Select
                    value={trigger.conditions?.status || "any"}
                    onValueChange={(value) => updateTriggerCondition(trigger.id, 'status', value === "any" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Conditions */}
              <div className="space-y-2">
                <Label>Additional Conditions</Label>
                <div className="space-y-2">
                  {Object.entries(trigger.conditions || {}).map(([key, value]) => (
                    key !== 'status' && (
                      <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{key}:</span>
                        <span className="text-sm">{String(value)}</span>
                        <Button
                          onClick={() => removeTriggerCondition(trigger.id, key)}
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Trigger Summary */}
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">Trigger Summary:</div>
                <div className="text-sm text-muted-foreground">
                  This workflow will activate when a <strong>{trigger.event_type.replace('_', ' ')}</strong> event occurs
                  {trigger.conditions?.status && (
                    <> with status <strong>"{trigger.conditions.status}"</strong></>
                  )}
                  {Object.keys(trigger.conditions || {}).length > 1 && 
                    <> and additional conditions are met</>
                  }
                  {trigger.is_active ? '.' : ' (currently disabled).'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {currentTriggers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No triggers configured</p>
            <p className="text-sm">Add triggers to define when this workflow should run</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};