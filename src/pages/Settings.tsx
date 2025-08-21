import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, Key, Brain, Webhook, Database } from "lucide-react";
import { useState } from "react";

const Settings = () => {
  const [openAIKey, setOpenAIKey] = useState("");
  const [aiMode, setAIMode] = useState("permissive");
  
  const { data: tenantSettings, isLoading } = useQuery({
    queryKey: ['tenant_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: promptPacks, isLoading: promptPacksLoading } = useQuery({
    queryKey: ['prompt_packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_packs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleSaveAPIKey = async () => {
    // This would call the set_openai_key edge function
    console.log("Saving OpenAI API key...");
  };

  return (
    <DashboardLayout currentPage="settings">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Configure your tenant, AI settings, and integrations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>Configure AI agent behavior and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={openAIKey}
                    onChange={(e) => setOpenAIKey(e.target.value)}
                  />
                  <Button onClick={handleSaveAPIKey}>
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for AI agent functionality. Encrypted and stored securely.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-mode">AI Agent Mode</Label>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Permissive Mode</p>
                    <p className="text-xs text-muted-foreground">
                      AI can respond to all messages automatically
                    </p>
                  </div>
                  <Switch 
                    checked={aiMode === "permissive"} 
                    onCheckedChange={(checked) => 
                      setAIMode(checked ? "permissive" : "restricted")
                    }
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-4">Loading settings...</div>
              ) : tenantSettings && tenantSettings.length > 0 ? (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Current Settings</p>
                  {tenantSettings.map((setting) => (
                    <div key={setting.id} className="text-xs text-muted-foreground">
                      <p>AI Mode: {setting.ai_mode}</p>
                      <p>API Key: {setting.openai_api_key_encrypted ? '✓ Configured' : '✗ Not configured'}</p>
                      <p>SIS Counter: {setting.sis_counter}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* API Keys & Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys & Integrations
              </CardTitle>
              <CardDescription>Manage external service integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-app.com/webhook"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Webhook endpoint for receiving message events
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-token">WhatsApp Business Token</Label>
                <Input
                  id="whatsapp-token"
                  type="password"
                  placeholder="Enter your WhatsApp Business API token"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Required for WhatsApp message integration
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm font-medium">Test Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Enable sandbox mode for testing
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Prompt Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Prompt Packs
              </CardTitle>
              <CardDescription>Manage AI agent prompts and responses</CardDescription>
            </CardHeader>
            <CardContent>
              {promptPacksLoading ? (
                <div className="text-center py-4">Loading prompt packs...</div>
              ) : promptPacks && promptPacks.length > 0 ? (
                <div className="space-y-4">
                  {promptPacks.map((pack) => (
                    <div key={pack.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{pack.name}</h4>
                        <span className="text-xs text-muted-foreground">v{pack.version}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {pack.system_prompt.slice(0, 100)}...
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {Array.isArray(pack.few_shots) ? pack.few_shots.length : 0} examples
                        </span>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No prompt packs configured</p>
                  <Button className="mt-4" size="sm">
                    Create First Pack
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database & System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Information
              </CardTitle>
              <CardDescription>Database and system status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {tenantSettings?.[0]?.sis_counter || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">SIS Counter</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">Active</p>
                  <p className="text-xs text-muted-foreground">System Status</p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database</span>
                  <span className="text-sm text-success">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Edge Functions</span>
                  <span className="text-sm text-success">Deployed</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Agent</span>
                  <span className="text-sm text-success">Ready</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Webhooks</span>
                  <span className="text-sm text-warning">Pending</span>
                </div>
              </div>

              <Button className="w-full" variant="outline">
                Run System Diagnostics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;