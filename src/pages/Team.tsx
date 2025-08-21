import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { UserManagement } from "@/components/users/UserManagement";

const Team = () => {
  return (
    <DashboardLayout currentPage="team">
      <div className="p-6 min-h-screen bg-background">
        <UserManagement />
      </div>
    </DashboardLayout>
  );
};

export default Team;