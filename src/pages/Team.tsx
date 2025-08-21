import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Shield, Mail } from "lucide-react";

const Team = () => {
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: userTenants, isLoading: userTenantsLoading } = useQuery({
    queryKey: ['user_tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_tenants')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <DashboardLayout currentPage="team">
      <div className="p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Team Management
            </h1>
            <p className="text-muted-foreground">
              Manage users, roles and tenant access
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Invite User
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {users?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {tenants?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Tenants</p>
                </div>
                <Shield className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {users?.filter(u => u.role === 'admin').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Administrators</p>
                </div>
                <UserPlus className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users
              </CardTitle>
              <CardDescription>Manage system users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : users && users.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tenants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Tenants
              </CardTitle>
              <CardDescription>Manage tenant organizations</CardDescription>
            </CardHeader>
            <CardContent>
              {tenantsLoading ? (
                <div className="text-center py-4">Loading tenants...</div>
              ) : tenants && tenants.length > 0 ? (
                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{tenant.name}</h3>
                        {tenant.subdomain && (
                          <p className="text-sm text-muted-foreground">
                            {tenant.subdomain}.domain.com
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(tenant.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {userTenants?.filter(ut => ut.tenant_id === tenant.id).length || 0} users
                        </Badge>
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tenants found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User-Tenant Relationships */}
        {!userTenantsLoading && userTenants && userTenants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>User-Tenant Assignments</CardTitle>
              <CardDescription>Current user access and role assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userTenants.map((assignment) => {
                  const user = users?.find(u => u.id === assignment.user_id);
                  const tenant = tenants?.find(t => t.id === assignment.tenant_id);
                  
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{user?.email || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">
                            in {tenant?.name || 'Unknown Tenant'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {assignment.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Team;