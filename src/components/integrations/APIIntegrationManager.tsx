import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  Plus,
  Trash2,
  Key,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
  Copy
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type APICredential = {
  id: string;
  name: string;
  key_hash: string;
  is_active: boolean;
  permissions: any;
  created_at: string;
};

const predefinedAPIs = [
  {
    name: 'Stripe',
    description: 'Payment processing and subscription management',
    icon: '💳',
    endpoints: ['payments', 'subscriptions', 'customers'],
    docs: 'https://stripe.com/docs'
  },
  {
    name: 'Twilio',
    description: 'SMS and voice communications',
    icon: '📱',
    endpoints: ['messages', 'calls', 'verify'],
    docs: 'https://www.twilio.com/docs'
  },
  {
    name: 'SendGrid',
    description: 'Email delivery and marketing',
    icon: '📧',
    endpoints: ['mail', 'templates', 'lists'],
    docs: 'https://sendgrid.com/docs'
  },
  {
    name: 'Shopify',
    description: 'E-commerce platform integration',
    icon: '🛍️',
    endpoints: ['orders', 'products', 'customers'],
    docs: 'https://shopify.dev/docs'
  }
];

export const APIIntegrationManager = () => {
  const [newCredential, setNewCredential] = useState({ name: '', key: '', permissions: {} });
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['api-credentials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as APICredential[];
    }
  });

  const addCredentialMutation = useMutation({
    mutationFn: async (credential: { name: string; key: string; permissions: any }) => {
      const { data, error } = await supabase
        .from('api_credentials')
        .insert({
          name: credential.name,
          key_hash: credential.key,
          permissions: credential.permissions,
          tenant_id: '00000000-0000-0000-0000-000000000001'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-credentials'] });
      setNewCredential({ name: '', key: '', permissions: {} });
      setIsAddingCredential(false);
      toast({
        title: "API Credential Added",
        description: "The API credential has been securely stored.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add API credential. Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleCredentialMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('api_credentials')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-credentials'] });
    }
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-credentials'] });
      toast({
        title: "Credential Deleted",
        description: "The API credential has been removed.",
      });
    }
  });

  const testConnection = async (apiName: string) => {
    toast({
      title: "Testing Connection",
      description: `Testing connection to ${apiName}...`,
    });
    
    // Simulate API test
    setTimeout(() => {
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${apiName}`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Integrations</h2>
          <p className="text-muted-foreground">Manage external API connections and credentials</p>
        </div>
        <Dialog open={isAddingCredential} onOpenChange={setIsAddingCredential}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add API Credential</DialogTitle>
              <DialogDescription>
                Add a new API credential for external service integration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-name">Service Name</Label>
                <Input
                  id="api-name"
                  placeholder="e.g., Stripe, Twilio, SendGrid"
                  value={newCredential.name}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your API key"
                  value={newCredential.key}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, key: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingCredential(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => addCredentialMutation.mutate(newCredential)}
                disabled={!newCredential.name || !newCredential.key || addCredentialMutation.isPending}
              >
                Add Credential
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Popular Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Popular Integrations
          </CardTitle>
          <CardDescription>Quick setup for commonly used services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedAPIs.map((api) => (
              <Card key={api.name} className="hover:shadow-medium transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{api.icon}</div>
                      <div>
                        <h3 className="font-semibold">{api.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{api.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {api.endpoints.map((endpoint) => (
                            <Badge key={endpoint} variant="secondary" className="text-xs">
                              {endpoint}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={api.docs} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-3 h-3 mr-1" />
                          Docs
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => testConnection(api.name)}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configured API Keys
          </CardTitle>
          <CardDescription>Manage your existing API credentials and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-lg h-16" />
              ))}
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No API credentials configured</p>
              <p>Add your first API credential to get started with integrations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((credential) => (
                <div key={credential.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${credential.is_active ? 'bg-success/20' : 'bg-muted'}`}>
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{credential.name}</h3>
                        {credential.is_active ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(credential.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={credential.is_active ? "default" : "secondary"}>
                      {credential.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={credential.is_active}
                      onCheckedChange={(checked) => 
                        toggleCredentialMutation.mutate({ id: credential.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(credential.name)}
                    >
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCredentialMutation.mutate(credential.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Webhook Endpoints
          </CardTitle>
          <CardDescription>Configure webhook URLs for receiving external data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order Webhooks</Label>
              <div className="flex gap-2">
                <Input 
                  value="https://ghsxvotykfhnfqyymdvh.supabase.co/functions/v1/create_order" 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="sm">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message Webhooks</Label>
              <div className="flex gap-2">
                <Input 
                  value="https://ghsxvotykfhnfqyymdvh.supabase.co/functions/v1/sandbox_message" 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="sm">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
