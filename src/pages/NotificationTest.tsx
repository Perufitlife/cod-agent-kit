import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2, RefreshCw, Bot, MessageSquare, ShoppingCart, Timer, Settings } from "lucide-react";

const NotificationTest = () => {
  const [phone, setPhone] = useState("+1234567890");
  const [message, setMessage] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("");
  const [lastResponse, setLastResponse] = useState<any>(null);
  const { toast } = useToast();

  // Test scenarios
  const testScenarios = [
    { name: "Saludo Básico", message: "Hola", intent: "greeting" },
    { name: "Confirmación Simple", message: "Sí", intent: "confirm" },
    { name: "Confirmación Explícita", message: "Confirmo mi pedido", intent: "confirm" },
    { name: "Cancelación", message: "Cancelar pedido", intent: "cancel" },
    { name: "Negación", message: "No gracias", intent: "cancel" },
    { name: "Cambio de Dirección", message: "Cambiar dirección a Calle 123", intent: "update_address" },
    { name: "Consulta de Estado", message: "¿Cuál es el estado de mi pedido?", intent: "status_inquiry" },
    { name: "Mensaje Ambiguo", message: "Tal vez más tarde", intent: "uncertain" },
    { name: "Texto Confuso", message: "asdfgh 123", intent: "uncertain" },
    { name: "Queja", message: "Estoy muy molesto con el servicio", intent: "complaint" },
  ];

  // Fetch tenant settings to show AI status
  const { data: tenantSettings } = useQuery({
    queryKey: ["tenant-settings-test"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenant_settings")
        .select("openai_api_key_encrypted, ai_mode")
        .eq("tenant_id", "00000000-0000-0000-0000-000000000001")
        .single();
      return data;
    }
  });

  const sendMessageMut = useMutation({
    mutationFn: async ({ phone, message }: { phone: string; message: string }) => {
      console.log("🚀 Sending test message:", { phone, message });
      const { data, error } = await supabase.functions.invoke('sandbox_message', {
        body: { 
          customer_phone: phone, 
          message_text: message
        }
      });
      
      if (error) {
        console.error("❌ sandbox_message failed:", error);
        throw error;
      }
      
      console.log("✅ Message sent successfully:", data);
      setLastResponse(data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Message Sent",
        description: `Intent: ${data?.intent || 'unknown'} | AI: ${tenantSettings?.openai_api_key_encrypted ? 'Yes' : 'No'}`,
      });
      setMessage("");
      setSelectedScenario("");
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const createDemoOrderMut = useMutation({
    mutationFn: async () => {
      console.log("🚀 Creating demo order...");
      const { data, error } = await supabase.functions.invoke('create_order', {
        body: {
          data: {
            customer_name: "Test Customer",
            product: "Demo Product",
            total: 99.99
          },
          source: "demo_test",
          external_order_id: `DEMO-${Date.now()}`
        }
      });
      
      if (error) {
        console.error("❌ create_order failed:", error);
        throw error;
      }
      
      console.log("✅ Demo order created:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Demo Order Created",
        description: "Check notifications for the new order alert!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: `Failed to create order: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Reset test data mutation
  const resetTestsMutation = useMutation({
    mutationFn: async (resetType: string) => {
      const { data, error } = await supabase.functions.invoke('reset_tests', {
        body: { resetType }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Reset Complete",
        description: data.message,
      });
      setLastResponse(null);
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const hasApiKey = tenantSettings?.openai_api_key_encrypted;
  const aiMode = tenantSettings?.ai_mode || "permissive";

  const selectScenario = (scenario: any) => {
    setMessage(scenario.message);
    setSelectedScenario(scenario.name);
  };

  return (
    <DashboardLayout currentPage="conversations">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sistema de Testing Avanzado
            </h1>
            <p className="text-muted-foreground">
              Configura OpenAI, prueba intents y workflows con reset completo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              asChild
            >
              <a href="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurar OpenAI
              </a>
            </Button>
            <Button
              variant="destructive"
              onClick={() => resetTestsMutation.mutate('all')}
              disabled={resetTestsMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {resetTestsMutation.isPending ? "Reseteando..." : "Reset All Tests"}
            </Button>
          </div>
        </div>

        {/* AI Status Card */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Estado del Sistema AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">OpenAI API</div>
                <Badge variant={hasApiKey ? "default" : "secondary"}>
                  {hasApiKey ? "Configurado" : "No configurado"}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Modo AI</div>
                <Badge variant="outline">{aiMode}</Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Procesamiento</div>
                <Badge variant={hasApiKey ? "default" : "secondary"}>
                  {hasApiKey ? "AI + Reglas" : "Solo Reglas"}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Estado</div>
                <div className={`w-3 h-3 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              </div>
            </div>
            {!hasApiKey && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  ⚠️ OpenAI no configurado. El sistema usará solo reglas básicas. <a href="/settings" className="underline">Configurar OpenAI</a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="scenarios" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scenarios">Escenarios de Test</TabsTrigger>
            <TabsTrigger value="manual">Test Manual</TabsTrigger>
            <TabsTrigger value="orders">Órdenes Demo</TabsTrigger>
            <TabsTrigger value="monitor">Monitor en Vivo</TabsTrigger>
          </TabsList>

          {/* Test Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Predefined Scenarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Escenarios Predefinidos
                  </CardTitle>
                  <CardDescription>
                    Selecciona un escenario para probar diferentes intents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {testScenarios.map((scenario, index) => (
                      <Button
                        key={index}
                        variant={selectedScenario === scenario.name ? "default" : "outline"}
                        className="justify-start h-auto p-3 text-left"
                        onClick={() => selectScenario(scenario)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{scenario.name}</span>
                          <span className="text-xs text-muted-foreground">"{scenario.message}"</span>
                          <Badge variant="secondary" className="text-xs mt-1 w-fit">
                            Expected: {scenario.intent}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Test Execution */}
              <Card>
                <CardHeader>
                  <CardTitle>Ejecutar Test</CardTitle>
                  <CardDescription>
                    Envía el mensaje seleccionado y observa el resultado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono de Cliente</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje</Label>
                    <Input
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Selecciona un escenario o escribe tu mensaje..."
                    />
                  </div>
                  {selectedScenario && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium">Escenario: {selectedScenario}</p>
                    </div>
                  )}
                  <Button 
                    onClick={() => sendMessageMut.mutate({ phone, message })}
                    disabled={sendMessageMut.isPending || !message.trim()}
                    className="w-full"
                  >
                    {sendMessageMut.isPending ? "Enviando..." : "Enviar Mensaje de Test"}
                  </Button>
                  
                  {lastResponse && (
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <h4 className="font-medium">Último Resultado:</h4>
                      <div className="text-sm space-y-1">
                        <div>Intent detectado: <Badge>{lastResponse.intent || 'N/A'}</Badge></div>
                        <div>Confianza: <Badge variant="outline">{lastResponse.confidence || 'N/A'}</Badge></div>
                        <div>Procesado por: <Badge variant={hasApiKey ? "default" : "secondary"}>
                          {hasApiKey ? "OpenAI + Reglas" : "Solo Reglas"}
                        </Badge></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Manual Test Tab */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Manual de Mensajes</CardTitle>
                <CardDescription>
                  Envía mensajes personalizados para probar casos específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-manual">Teléfono de Cliente</Label>
                  <Input
                    id="phone-manual"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message-manual">Mensaje</Label>
                  <Input
                    id="message-manual"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje de test..."
                  />
                </div>
                <Button 
                  onClick={() => sendMessageMut.mutate({ phone, message })}
                  disabled={sendMessageMut.isPending || !message.trim()}
                  className="w-full"
                >
                  {sendMessageMut.isPending ? "Enviando..." : "Enviar Mensaje"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Órdenes Demo
                </CardTitle>
                <CardDescription>
                  Crea órdenes de demostración para probar notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Detalles de Orden Demo:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Cliente: Test Customer</li>
                    <li>• Producto: Demo Product</li>
                    <li>• Total: $99.99</li>
                    <li>• Fuente: demo_test</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => createDemoOrderMut.mutate()}
                  disabled={createDemoOrderMut.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {createDemoOrderMut.isPending ? "Creando..." : "Crear Orden Demo"}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetTestsMutation.mutate('orders')}
                    disabled={resetTestsMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Reset Órdenes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetTestsMutation.mutate('timers')}
                    disabled={resetTestsMutation.isPending}
                  >
                    <Timer className="w-4 h-4 mr-1" />
                    Reset Timers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Acciones de Reset Selectivo</CardTitle>
                  <CardDescription>
                    Limpia datos específicos sin afectar el resto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => resetTestsMutation.mutate('messages')}
                    disabled={resetTestsMutation.isPending}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Reset Mensajes y Conversaciones
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => resetTestsMutation.mutate('orders')}
                    disabled={resetTestsMutation.isPending}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Reset Órdenes Demo
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => resetTestsMutation.mutate('events')}
                    disabled={resetTestsMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Eventos (+24h)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => resetTestsMutation.mutate('timers')}
                    disabled={resetTestsMutation.isPending}
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    Reset Timers Programados
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sistema de Monitoreo</CardTitle>
                  <CardDescription>
                    Estado actual del sistema y configuración
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Tenant ID:</span>
                      <code className="text-xs">...000001</code>
                    </div>
                    <div className="flex justify-between">
                      <span>API Key:</span>
                      <Badge variant={hasApiKey ? "default" : "secondary"}>
                        {hasApiKey ? "✓ Set" : "✗ Not Set"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Mode:</span>
                      <Badge variant="outline">{aiMode}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing:</span>
                      <span className="text-xs">{hasApiKey ? "AI + Rules" : "Rules Only"}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Próximos pasos:</p>
                    {!hasApiKey ? (
                      <div className="text-xs space-y-1 text-orange-600 dark:text-orange-400">
                        <div>1. <a href="/settings" className="underline">Configurar OpenAI API Key</a></div>
                        <div>2. Probar escenarios con AI</div>
                        <div>3. Comparar respuestas AI vs reglas</div>
                      </div>
                    ) : (
                      <div className="text-xs space-y-1 text-green-600 dark:text-green-400">
                        <div>✓ OpenAI configurado</div>
                        <div>✓ Listo para tests avanzados</div>
                        <div>✓ Crear workflows</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
};

export default NotificationTest;