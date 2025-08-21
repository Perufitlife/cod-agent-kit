import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";

const Settings = () => {
  return (
    <DashboardLayout currentPage="settings">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <PerformanceMonitor />
      </div>
    </DashboardLayout>
  );
};

export default Settings;