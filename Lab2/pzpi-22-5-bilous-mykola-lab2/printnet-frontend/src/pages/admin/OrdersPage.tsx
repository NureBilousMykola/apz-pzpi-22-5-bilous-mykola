import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import type { Order, OrderFilters } from "@/types";
import {
  Search,
  Eye,
  CheckCircle,
  Clock,
  Loader2,
  Download,
  Printer,
  XCircle,
} from "lucide-react";

export function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const filters: OrderFilters = {};

        if (statusFilter !== "all") {
          filters.status = statusFilter;
        }

        const response = await apiClient.getOrders(filters);
        setOrders(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "printing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "created":
        return <Clock className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "processing":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "printing":
        return <Printer className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "failed":
        return <XCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Helper function to get the latest status from the statuses array
  const getLatestStatus = (order: Order): string => {
    if (order.statuses && order.statuses.length > 0) {
      return order.statuses[order.statuses.length - 1].status;
    }
    return "unknown";
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      await apiClient.updateOrderStatus(orderId, {
        status: newStatus,
        description: `Status updated to ${newStatus}`,
      });

      // Refresh orders
      const filters: OrderFilters = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      const response = await apiClient.getOrders(filters);
      setOrders(response.data);
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleExportOrders = async () => {
    try {
      const filters: OrderFilters = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      // Create CSV content
      const csvContent = [
        ["Order ID", "Customer", "Machine", "Status", "Cost", "Created"].join(
          ","
        ),
        ...filteredOrders.map((order) =>
          [
            order.id,
            `"${order.user.first_name} ${order.user.last_name}"`,
            `"${order.machine?.location || "Unknown location"}"`,
            getLatestStatus(order),
            order.cost,
            new Date(order.created_at).toLocaleDateString(),
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export orders:", err);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.machine?.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => getLatestStatus(o) === "pending"
  ).length;
  const processingOrders = orders.filter(
    (o) => getLatestStatus(o) === "processing"
  ).length;
  const completedOrders = orders.filter(
    (o) => getLatestStatus(o) === "completed"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("orders.title")}
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor all customer orders
          </p>
        </div>
        <Button onClick={handleExportOrders}>
          <Download className="mr-2 h-4 w-4" />
          Export Orders
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="printing">Printing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>A list of all orders in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.user.first_name} {order.user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{order.machine?.location || "Unknown location"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(getLatestStatus(order))}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(getLatestStatus(order))}
                          {t(`orders.${getLatestStatus(order)}`, getLatestStatus(order))}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>${order.cost}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog
                          open={isDetailsOpen}
                          onOpenChange={setIsDetailsOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about order{" "}
                                {selectedOrder?.id}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">
                                      Customer
                                    </label>
                                    <p>
                                      {selectedOrder.user.first_name}{" "}
                                      {selectedOrder.user.last_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedOrder.user.email}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Machine
                                    </label>
                                    <p>{selectedOrder.machine?.location || "Unknown location"}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedOrder.machine?.serial_number || "Unknown serial"}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    Status
                                  </label>
                                  <div className="mt-1">
                                    <Select
                                      value={getLatestStatus(selectedOrder)}
                                      onValueChange={(value) =>
                                        handleUpdateOrderStatus(
                                          selectedOrder.id,
                                          value
                                        )
                                      }
                                    >
                                      <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="created">
                                          Created
                                        </SelectItem>
                                        <SelectItem value="pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="processing">
                                          Processing
                                        </SelectItem>
                                        <SelectItem value="printing">
                                          Printing
                                        </SelectItem>
                                        <SelectItem value="completed">
                                          Completed
                                        </SelectItem>
                                        <SelectItem value="failed">
                                          Failed
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                          Cancelled
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">
                                      Total Cost
                                    </label>
                                    <p>${selectedOrder.cost}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Estimated Time
                                    </label>
                                    <p>
                                      {selectedOrder.estimated_completion_time}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    Model File
                                  </label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedOrder.model_file_url}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
