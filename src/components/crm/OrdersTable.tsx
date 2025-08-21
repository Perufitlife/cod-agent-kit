import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { Search, Plus, Filter, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  systemOrderId: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: string;
  createdAt: string;
  needsAttention: boolean;
}

// Mock data
const mockOrders: Order[] = [
  {
    id: "1",
    systemOrderId: "SIS-2001",
    status: "pending",
    customerName: "Maria Rodriguez",
    customerPhone: "+1234567890",
    totalAmount: "$89.99",
    createdAt: "2024-01-21T10:30:00Z",
    needsAttention: false,
  },
  {
    id: "2", 
    systemOrderId: "SIS-2002",
    status: "confirmed",
    customerName: "John Smith",
    customerPhone: "+1234567891",
    totalAmount: "$156.50",
    createdAt: "2024-01-21T09:15:00Z",
    needsAttention: false,
  },
  {
    id: "3",
    systemOrderId: "SIS-2003", 
    status: "awaiting_customer_contact",
    customerName: "Ana García",
    customerPhone: "+1234567892",
    totalAmount: "$203.25",
    createdAt: "2024-01-21T08:45:00Z",
    needsAttention: true,
  }
];

export const OrdersTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.systemOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Orders Management</CardTitle>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Order ID</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{order.systemOrderId}</span>
                      {order.needsAttention && (
                        <Badge variant="destructive" className="text-xs">
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {order.totalAmount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};