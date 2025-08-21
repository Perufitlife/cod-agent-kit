import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { APIIntegrationManager } from "@/components/integrations/APIIntegrationManager";

const Integrations = () => {
  return (
    <DashboardLayout currentPage="integrations">
      <div className="p-6 min-h-screen bg-background">
        <APIIntegrationManager />
      </div>
    </DashboardLayout>
  );
};

export default Integrations;