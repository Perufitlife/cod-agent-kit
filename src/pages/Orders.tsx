import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { OrdersTable } from "@/components/crm/OrdersTable";
import { StatsCards } from "@/components/crm/StatsCards";

const Orders = () => {
  return (
    <DashboardLayout currentPage="orders">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Orders Management
            </h1>
            <p className="text-muted-foreground">
              Manage and track all customer orders
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Order Stats</h2>
          <StatsCards />
        </div>

        <div className="space-y-6">
          <OrdersTable />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Orders;