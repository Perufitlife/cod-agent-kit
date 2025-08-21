import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { StatsCards } from "@/components/crm/StatsCards";
import { OrdersTable } from "@/components/crm/OrdersTable";
import { MessageSandbox } from "@/components/crm/MessageSandbox";

const Index = () => {
  return (
    <DashboardLayout currentPage="dashboard">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Order CRM Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered multi-tenant COD e-commerce management system
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Demo Tenant</p>
            <p className="text-lg font-semibold text-foreground">Welcome back!</p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Orders Table - Takes 2 columns */}
          <div className="xl:col-span-2">
            <OrdersTable />
          </div>

          {/* Message Sandbox - Takes 1 column */}
          <div className="xl:col-span-1">
            <MessageSandbox />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>
            Order CRM AI v1.0 - Multi-tenant, Config-first, COD e-commerce system
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;