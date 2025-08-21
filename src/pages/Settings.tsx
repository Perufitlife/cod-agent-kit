import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Key, Bot, Settings2, Eye, EyeOff } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiMode, setAiMode] = useState("permissive");

  // Fetch current tenant settings
  const { data: tenantSettings, isLoading } = useQuery({
    queryKey: ["tenant-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_settings")
        .select("openai_api_key_encrypted, ai_mode, updated_at")
        .eq("tenant_id", "00000000-0000-0000-0000-000000000001")
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    }
  });

  // Update OpenAI API key
  const updateKeyMutation = useMutation({
    mutationFn: async (newApiKey: string) => {
      const { data, error } = await supabase.functions.invoke('set_openai_key', {
        body: { apiKey: newApiKey }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "API Key Updated",
        description: `Key updated successfully. Masked: ${data.masked}`,
      });
      setApiKey("");
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update API key: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update AI mode
  const updateModeMutation = useMutation({
    mutationFn: async (mode: string) => {
      const { error } = await supabase
        .from("tenant_settings")
        .update({ ai_mode: mode, updated_at: new Date().toISOString() })
        .eq("tenant_id", "00000000-0000-0000-0000-000000000001");
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "AI Mode Updated",
        description: "AI processing mode updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update AI mode: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }
    
    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Error",
        description: "OpenAI API keys should start with 'sk-'",
        variant: "destructive",
      });
      return;
    }
    
    updateKeyMutation.mutate(apiKey);
  };

  const handleModeChange = (mode: string) => {
    setAiMode(mode);
    updateModeMutation.mutate(mode);
  };

  const hasApiKey = tenantSettings?.openai_api_key_encrypted;
  const currentMode = tenantSettings?.ai_mode || "permissive";

  return (
    <DashboardLayout currentPage="settings">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Configure system preferences and integrations
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* OpenAI API Configuration */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-primary" />
                <span>OpenAI API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">
                    {hasApiKey ? 'API Key Configured' : 'No API Key Set'}
                  </span>
                </div>
                {hasApiKey && (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>

              {hasApiKey && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ OpenAI integration is active. The system will use AI for advanced intent detection and message processing.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium">OpenAI API Key</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSaveApiKey}
                    disabled={updateKeyMutation.isPending}
                    className="bg-gradient-primary"
                  >
                    {updateKeyMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your OpenAI API key to enable AI-powered intent detection and message processing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Processing Mode */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-primary" />
                <span>AI Processing Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Processing Mode</label>
                <Select value={currentMode} onValueChange={handleModeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permissive">
                      <div className="flex flex-col">
                        <span>Permissive</span>
                        <span className="text-xs text-muted-foreground">AI + fallback rules</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="strict">
                      <div className="flex flex-col">
                        <span>Strict</span>
                        <span className="text-xs text-muted-foreground">AI only (requires API key)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {currentMode === "permissive" 
                      ? "Uses AI when available, falls back to rule-based processing"
                      : "Uses only AI processing (requires OpenAI API key)"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Current Configuration:</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>OpenAI API Key:</span>
                    <Badge variant={hasApiKey ? "default" : "secondary"}>
                      {hasApiKey ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>AI Mode:</span>
                    <Badge variant="outline">{currentMode}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Status:</span>
                    <Badge variant={hasApiKey ? "default" : "secondary"}>
                      {hasApiKey ? "AI Enabled" : "Rule-based Only"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="shadow-medium lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  <p className="mt-2 text-muted-foreground">Loading system information...</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Tenant ID</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">00000000-0000-0000-0000-000000000001</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">AI Processing</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hasApiKey ? "OpenAI + Rules" : "Rule-based Only"}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm">Last Updated</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tenantSettings?.updated_at ? new Date(tenantSettings.updated_at).toLocaleString() : "Never"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;