import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { StatsCards } from "@/components/crm/StatsCards";
import { OrdersTable } from "@/components/crm/OrdersTable";
import { MessageSandbox } from "@/components/crm/MessageSandbox";

const Index = () => {
  console.log("Index page rendering");
  
  return (
    <DashboardLayout currentPage="dashboard">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Order CRM Dashboard
            </h1>
            <p className="text-muted-foreground">
              AI-powered multi-tenant COD e-commerce management system
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border shadow-soft">
            <p className="text-sm text-muted-foreground">Demo Tenant</p>
            <p className="text-lg font-semibold text-foreground">Welcome back!</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Key Metrics</h2>
          <StatsCards />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Table - Takes 2 columns */}
          <div className="lg:col-span-2">
            <OrdersTable />
          </div>

          {/* Message Sandbox - Takes 1 column */}
          <div className="lg:col-span-1">
            <MessageSandbox />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 mt-8 border-t border-border">
          <p>
            Order CRM AI v1.0 - Multi-tenant, Config-first, COD e-commerce system
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;