import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { Search, Plus, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type OrderRow = {
  id: string;
  system_order_id: string;
  status: string | null;
  data: any;
  created_at: string | null;
  needs_attention: boolean | null;
  tenant_id: string;
};

async function fetchOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, system_order_id, status, data, created_at, needs_attention, tenant_id")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

async function createDemoOrder() {
  const res = await fetch("/functions/v1/create_order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "manual",
      data: {
        name: "Demo Customer",
        address: "123 Test St",
        city: "Testville",
        province: "TS",
        country: "US",
        customer_phone: "+1234567890",
        products: [{ product_name: "Gadget", quantity: 1, unit_price: 49.9 }],
      },
    }),
  });
  if (!res.ok) throw new Error("create_order failed");
  return res.json();
}

export const OrdersTable = () => {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const createMut = useMutation({ mutationFn: createDemoOrder, onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }) });

  const filtered = orders.filter(o => {
    const name = o.data?.name?.toString().toLowerCase() || "";
    const phone = o.data?.customer_phone || "";
    const s = searchTerm.toLowerCase();
    const matchesSearch = !s || o.system_order_id.toLowerCase().includes(s) || name.includes(s) || phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || (o.status || "").toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Orders Management</CardTitle>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="bg-gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            {createMut.isPending ? "Creating..." : "Create Demo Order"}
          </Button>
        </div>

        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search orders, customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? <div className="p-6">Loading…</div> : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{o.system_order_id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{o.data?.name || "-"}</p>
                        <p className="text-sm text-muted-foreground">{o.data?.customer_phone || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={(o.status || "pending")} /></TableCell>
                    <TableCell className="text-muted-foreground">{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</TableCell>
                    <TableCell>{o.needs_attention ? <Badge variant="destructive">Needs Attention</Badge> : null}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};