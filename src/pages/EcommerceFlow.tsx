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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ShoppingCart, Bot, CheckCircle, AlertTriangle, Clock, Eye, RotateCcw, Zap, TrendingUp } from "lucide-react";

const EcommerceFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerPhone] = useState("+1234567890");
  const [messageText, setMessageText] = useState("");
  const [conversationId, setConversationId] = useState<string>("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isComparative, setIsComparative] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Realistic e-commerce flow scenarios
  const flowSteps = [
    {
      step: 1,
      title: "Orden Creada",
      description: "Cliente recibe notificación de nueva orden SIS-2008",
      status: "completed",
      action: "Demo order exists in system"
    },
    {
      step: 2,
      title: "Confirmación Inicial",
      description: "Cliente confirma recepción del pedido",
      message: "Sí, confirmo mi pedido",
      expectedIntent: "confirm",
      status: "pending"
    },
    {
      step: 3,
      title: "Cambio de Dirección",
      description: "Cliente necesita actualizar dirección de entrega",
      message: "Necesito cambiar la dirección a Av. Libertad 789, San Isidro",
      expectedIntent: "update_address",
      expectedEntities: ["Av. Libertad 789, San Isidro"],
      status: "pending"
    },
    {
      step: 4,
      title: "Consulta de Estado",
      description: "Cliente pregunta por el estado específico de su orden",
      message: "¿Cuándo llega mi orden SIS-2008?",
      expectedIntent: "status_inquiry", 
      expectedEntities: ["SIS-2008"],
      status: "pending"
    },
    {
      step: 5,
      title: "Solicitud Urgente",
      description: "Cliente necesita entrega urgente",
      message: "Es urgente, necesito mi pedido SIS-2008 mañana antes de las 2pm",
      expectedIntent: "update_delivery",
      expectedEntities: ["SIS-2008", "mañana", "2pm"],
      status: "pending"
    }
  ];

  // Get current orders
  const { data: orders } = useQuery({
    queryKey: ["orders-ecommerce"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, system_order_id, status, created_at, data")
        .eq("data->>customer_phone", customerPhone)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Get AI configuration
  const { data: aiConfig } = useQuery({
    queryKey: ["ai-config"],
    queryFn: async () => {
      const { data: userTenant } = await supabase
        .from("user_tenants")
        .select("tenant_id")
        .limit(1)
        .single();

      if (!userTenant) throw new Error("No tenant found");

      const { data, error } = await supabase
        .from("tenant_settings")
        .select("ai_mode, openai_api_key_encrypted")
        .eq("tenant_id", userTenant.tenant_id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Reset test data
  const resetTestsMut = useMutation({
    mutationFn: async (resetType: string) => {
      const response = await supabase.functions.invoke("reset_tests", {
        body: { resetType }
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setTestResults([]);
      setCurrentStep(1);
      queryClient.invalidateQueries({ queryKey: ["orders-ecommerce"] });
      toast({
        title: "✅ Reset completado",
        description: `${data.results.orders || 'Test data cleared'}`
      });
    }
  });

  // Create demo order
  const createDemoOrderMut = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke("create_order", {
        body: { 
          customer_phone: customerPhone,
          test_mode: true 
        }
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-ecommerce"] });
      toast({
        title: "🛒 Demo order creada",
        description: "Nueva orden lista para testing"
      });
    }
  });

  // Send message mutation
  const sendMessageMut = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string, conversationId: string }) => {
      const response = await supabase.functions.invoke("sandbox_message", {
        body: {
          customer_phone: customerPhone,
          message_text: message,
          conversation_id: conversationId
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      const newResult = {
        step: currentStep,
        message: messageText,
        response: data,
        timestamp: new Date(),
        aiUsed: data.ai_used,
        intent: data.intent,
        confidence: data.confidence,
        entities: data.entities,
        cost: data.ai_used ? 0.00006 : 0 // Approximate OpenAI cost
      };
      
      setTestResults(prev => [...prev, newResult]);
      
      // Update step status
      const currentStepData = flowSteps[currentStep - 1];
      if (currentStepData) {
        currentStepData.status = "completed";
      }
      
      toast({
        title: isComparative ? "📊 Resultado comparativo" : "✅ Mensaje procesado",
        description: `${data.intent} (${data.confidence}) ${data.ai_used ? '🤖 OpenAI' : '📋 Reglas'}`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Auto-set message for current step
  useEffect(() => {
    const currentStepData = flowSteps[currentStep - 1];
    if (currentStepData?.message) {
      setMessageText(currentStepData.message);
    }
  }, [currentStep]);

  // Ensure conversation exists
  useEffect(() => {
    const ensureConversation = async () => {
      try {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("customer_phone", customerPhone)
          .single();

        if (existing) {
          setConversationId(existing.id);
        } else {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({
              customer_phone: customerPhone,
              tenant_id: "00000000-0000-0000-0000-000000000001"
            })
            .select("id")
            .single();
          
          if (newConv) {
            setConversationId(newConv.id);
          }
        }
      } catch (error) {
        console.error("Error ensuring conversation:", error);
      }
    };

    ensureConversation();
  }, [customerPhone]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMut.mutate({ message: messageText, conversationId });
  };

  const handleNextStep = () => {
    if (currentStep < flowSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const runComparativeTest = async () => {
    setIsComparative(true);
    toast({
      title: "🚀 Iniciando test comparativo", 
      description: "Ejecutando 5 mensajes con análisis completo"
    });
    
    // Send all test messages sequentially
    for (let i = 0; i < flowSteps.length; i++) {
      const step = flowSteps[i];
      if (step.message) {
        setCurrentStep(step.step);
        setMessageText(step.message);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for visibility
        await sendMessageMut.mutateAsync({ message: step.message, conversationId });
      }
    }
    setIsComparative(false);
  };

  const calculateMetrics = () => {
    const aiResults = testResults.filter(r => r.aiUsed);
    const ruleResults = testResults.filter(r => !r.aiUsed);
    const totalCost = testResults.reduce((sum, r) => sum + (r.cost || 0), 0);
    
    return {
      totalMessages: testResults.length,
      aiAccuracy: aiResults.length > 0 ? (aiResults.filter(r => r.confidence >= 0.8).length / aiResults.length * 100).toFixed(1) : 0,
      rulesAccuracy: ruleResults.length > 0 ? (ruleResults.filter(r => r.confidence >= 0.8).length / ruleResults.length * 100).toFixed(1) : 0,
      totalCost: totalCost.toFixed(6),
      entitiesExtracted: testResults.reduce((sum, r) => sum + (Object.keys(r.entities || {}).length), 0)
    };
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "current": return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Flujo E-commerce Realista</h1>
          <p className="text-muted-foreground">
            Simula un flujo completo de pedido con WhatsApp + IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flow Steps */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Flujo del Pedido
                </CardTitle>
                <CardDescription>
                  Pasos del proceso e-commerce
                </CardDescription>
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => resetTestsMut.mutate('all')}
                    disabled={resetTestsMut.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => createDemoOrderMut.mutate()}
                    disabled={createDemoOrderMut.isPending}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Demo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {flowSteps.map((step, index) => (
                  <div
                    key={step.step}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentStep === step.step
                        ? "border-primary bg-primary/5"
                        : step.status === "completed"
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setCurrentStep(step.step)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getStepIcon(currentStep === step.step ? "current" : step.status)}
                      <span className="font-medium">
                        Paso {step.step}: {step.title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {step.message && (
                      <p className="text-xs mt-2 p-2 bg-gray-50 rounded italic">
                        "{step.message}"
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Testing Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Status & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Estado IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label>Modo</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={aiConfig?.ai_mode === "smart" ? "default" : "secondary"}>
                          {aiConfig?.ai_mode || "loading..."}
                        </Badge>
                        {aiConfig?.openai_api_key_encrypted && (
                          <Badge variant="outline">OpenAI ✓</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Órdenes Activas</Label>
                      <p className="text-2xl font-bold text-primary">
                        {orders?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Métricas Live
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mensajes:</span>
                      <Badge>{calculateMetrics().totalMessages}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Accuracy IA:</span>
                      <Badge variant="default">{calculateMetrics().aiAccuracy}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Entities:</span>
                      <Badge variant="outline">{calculateMetrics().entitiesExtracted}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <Badge variant="secondary">${calculateMetrics().totalCost}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Message Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Paso {currentStep}: {flowSteps[currentStep - 1]?.title}
                </CardTitle>
                <CardDescription>
                  {flowSteps[currentStep - 1]?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cliente: {customerPhone}</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje del Cliente</Label>
                  <Input
                    id="message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Escribe el mensaje del cliente..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendMessage}
                    disabled={sendMessageMut.isPending}
                    className="flex-1"
                  >
                    {sendMessageMut.isPending ? "Enviando..." : "Enviar Mensaje"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleNextStep}
                    disabled={currentStep >= flowSteps.length}
                  >
                    Siguiente
                  </Button>
                </div>
                
                <div className="pt-2 border-t">
                  <Button 
                    onClick={runComparativeTest}
                    disabled={sendMessageMut.isPending || !conversationId}
                    variant="default"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    🚀 Test Comparativo Completo (5 pasos)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Resultados del Flujo
                </CardTitle>
                <CardDescription>
                  Monitoreo en tiempo real de respuestas IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay resultados aún. Comienza enviando mensajes.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {testResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium">Paso {result.step}</span>
                            <Badge 
                              variant={result.aiUsed ? "default" : "secondary"} 
                              className="ml-2"
                            >
                              {result.aiUsed ? "🤖 OpenAI" : "📋 Reglas"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Mensaje:</strong>
                            <p className="text-muted-foreground italic">"{result.message}"</p>
                          </div>
                          <div>
                            <strong>Análisis:</strong>
                            <p>Intent: <Badge variant="outline">{result.intent}</Badge></p>
                            <p>Confidence: {result.confidence}</p>
                            {result.entities && Object.keys(result.entities).length > 0 && (
                              <p>Entidades: {JSON.stringify(result.entities)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EcommerceFlow;