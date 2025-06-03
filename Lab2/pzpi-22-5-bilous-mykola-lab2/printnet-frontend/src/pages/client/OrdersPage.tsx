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
import { OrderCreationDialog } from "@/components/OrderCreationDialog";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { Order } from "@/types";
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  FileText,
  Eye,
  Loader2,
} from "lucide-react";

export function OrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getOrders({
          userId: user?.id,
        });
        setOrders(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  const refreshOrders = async () => {
    try {
      const response = await apiClient.getOrders({
        userId: user?.id,
      });
      setOrders(response.data);
    } catch (err) {
      console.error("Failed to refresh orders:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "printing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Helper function to get the latest status from the statuses array
  const getLatestStatus = (order: Order): string => {
    if (order.statuses && order.statuses.length > 0) {
      return order.statuses[order.statuses.length - 1].status;
    }
    return "unknown";
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.model_file_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.machine?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.machine?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

    // Get the latest status from the statuses array
    const latestStatus = getLatestStatus(order);

    const matchesStatus =
      statusFilter === "all" || latestStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("orders.title")}
          </h1>
          <p className="text-muted-foreground">
            Manage and track your 3D printing orders
          </p>
        </div>
        <OrderCreationDialog
          onOrderCreated={refreshOrders}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("orders.createOrder")}
            </Button>
          }
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
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
                <SelectItem value="created">{t("orders.created")}</SelectItem>
                <SelectItem value="pending">{t("orders.pending")}</SelectItem>
                <SelectItem value="printing">{t("orders.printing")}</SelectItem>
                <SelectItem value="completed">
                  {t("orders.completed")}
                </SelectItem>
                <SelectItem value="failed">{t("orders.failed")}</SelectItem>
                <SelectItem value="cancelled">
                  {t("orders.cancelled")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading orders...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-destructive">{error}</div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {!loading && !error && (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const fileName =
              order.model_file_url.split("/").pop() || "Unknown file";

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {order.id}
                        <Badge className={getStatusColor(getLatestStatus(order))}>
                          {t(`orders.${getLatestStatus(order)}`)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {fileName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {order.machine?.location || "Unknown location"} (
                          {order.machine?.serial_number || "Unknown serial"})
                        </span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        ${order.cost}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Print Parameters</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {order.print_settings?.material && (
                          <div>Material: {order.print_settings.material}</div>
                        )}
                        {order.print_settings?.infill && (
                          <div>Infill: {order.print_settings.infill}%</div>
                        )}
                        {order.print_settings?.layerHeight && (
                          <div>
                            Layer Height: {order.print_settings.layerHeight}mm
                          </div>
                        )}
                        {order.print_settings?.notes && (
                          <div>Notes: {order.print_settings.notes}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Timeline</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created: {new Date(order.created_at).toLocaleString()}
                        </div>
                        {order.estimated_completion_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Est. Complete:{" "}
                            {new Date(
                              order.estimated_completion_time
                            ).toLocaleString()}
                          </div>
                        )}
                        {order.actual_completion_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Completed:{" "}
                            {new Date(
                              order.actual_completion_time
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end items-end">
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        {(getLatestStatus(order) === "created" || getLatestStatus(order) === "pending") && (
                          <Button variant="destructive" size="sm">
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              No orders found matching your criteria.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
