import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderCreationDialog } from "@/components/OrderCreationDialog";
import { apiClient } from "@/lib/api";
import type { ClientStats, Order } from "@/types";
import {
  ShoppingCart,
  Printer,
  Clock,
  CheckCircle,
  Plus,
  MapPin,
  CreditCard,
  Loader2,
} from "lucide-react";

export function ClientDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [stats, setStats] = useState<ClientStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, ordersResponse] = await Promise.all([
          apiClient.getClientStats(user?.id || ""),
          apiClient.getOrders({}),
        ]);

        setStats(statsResponse.data);
        setRecentOrders(ordersResponse.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          {error || "Failed to load dashboard data"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.welcome")}, {user?.first_name || user?.email}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your 3D printing orders today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalOrders")}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.activeOrders")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.completedOrders")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.totalSpent || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          <CardDescription>Quick shortcuts to common actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <OrderCreationDialog
              onOrderCreated={() => {
                // Refresh dashboard data when order is created
                window.location.reload();
              }}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("dashboard.createOrder")}
                </Button>
              }
            />
            <Button variant="outline" onClick={() => navigate("/machines")}>
              <Printer className="mr-2 h-4 w-4" />
              {t("dashboard.viewMachines")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/machines")}>
              <MapPin className="mr-2 h-4 w-4" />
              Find Locations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentOrders")}</CardTitle>
          <CardDescription>Your latest 3D printing orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Order #{order.id}</span>
                    <Badge className={getStatusColor(getLatestStatus(order))}>
                      {t(`orders.${getLatestStatus(order)}`)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.machine?.location || "Unknown location"} ({order.machine?.serial_number || "Unknown serial"})
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${(parseFloat(order.cost) || 0).toFixed(2)}
                  </div>
                  {getLatestStatus(order) === "printing" &&
                    order.estimated_completion_time && (
                      <div className="text-sm text-muted-foreground">
                        Est:{" "}
                        {new Date(
                          order.estimated_completion_time
                        ).toLocaleTimeString()}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
