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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api";
import type {
  OrderAnalytics,
  MachineAnalytics,
  RevenueAnalytics,
  AnalyticsFilters,
  GenerateReportRequest,
} from "@/types";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Activity,
  Download,
  Loader2,
} from "lucide-react";

export function AnalyticsPage() {
  const { t } = useTranslation();
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(
    null
  );
  const [machineAnalytics, setMachineAnalytics] =
    useState<MachineAnalytics | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] =
    useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days ago
    endDate: new Date().toISOString().split("T")[0], // today
    reportType: "daily",
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [orderResponse, machineResponse, revenueResponse] =
          await Promise.all([
            apiClient.getOrderAnalytics(filters),
            apiClient.getMachineAnalytics(filters),
            apiClient.getRevenueAnalytics(filters),
          ]);

        setOrderAnalytics(orderResponse.data);
        setMachineAnalytics(machineResponse.data);
        setRevenueAnalytics(revenueResponse.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [filters]);

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExportData = async () => {
    try {
      const blob = await apiClient.exportAnalyticsData(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${filters.startDate}-to-${filters.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export analytics data:", err);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const reportRequest: GenerateReportRequest = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        reportType: filters.reportType || "daily",
        machineId: filters.machineId,
      };

      const response = await apiClient.generateReport(reportRequest);

      // Create a downloadable report
      const reportContent = JSON.stringify(response.data, null, 2);
      const blob = new Blob([reportContent], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${filters.reportType}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  };

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
            {t("analytics.title")}
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your 3D printing business
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            {t("analytics.exportData")}
          </Button>
          <Button onClick={handleGenerateReport}>
            <BarChart3 className="mr-2 h-4 w-4" />
            {t("analytics.generateReport")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.dateRange")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">
                {t("analytics.startDate")}
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">
                {t("analytics.endDate")}
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Report Type</label>
              <Select
                value={filters.reportType}
                onValueChange={(value) =>
                  handleFilterChange("reportType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("analytics.daily")}</SelectItem>
                  <SelectItem value="weekly">
                    {t("analytics.weekly")}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {t("analytics.monthly")}
                  </SelectItem>
                  <SelectItem value="custom">
                    {t("analytics.custom")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="text-center py-8 text-red-500">
            {error}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              {t("analytics.overview")}
            </TabsTrigger>
            <TabsTrigger value="orders">
              {t("analytics.orderAnalytics")}
            </TabsTrigger>
            <TabsTrigger value="machines">
              {t("analytics.machineAnalytics")}
            </TabsTrigger>
            <TabsTrigger value="revenue">
              {t("analytics.revenueAnalytics")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("analytics.totalOrders")}
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orderAnalytics?.totalOrders || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("analytics.totalRevenue")}
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${orderAnalytics?.totalRevenue || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("analytics.averageOrderValue")}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${orderAnalytics?.averageOrderValue?.toFixed(2) || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Machines
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {machineAnalytics?.activeMachines || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.ordersByStatus")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {orderAnalytics?.ordersByStatus &&
                      Object.entries(orderAnalytics.ordersByStatus).map(
                        ([status, count]) => (
                          <div key={status} className="flex justify-between">
                            <span className="capitalize">{status}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.machinePerformance")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {machineAnalytics?.machinePerformance
                      ?.slice(0, 5)
                      .map((machine) => (
                        <div key={machine.id} className="flex justify-between">
                          <span className="text-sm">{machine.location}</span>
                          <span className="font-medium">
                            {machine.totalOrders} orders
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.totalOrders")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {orderAnalytics?.totalOrders || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.totalRevenue")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${orderAnalytics?.totalRevenue || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.averageOrderValue")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${orderAnalytics?.averageOrderValue?.toFixed(2) || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.ordersByStatus")}</CardTitle>
                  <CardDescription>
                    Distribution of orders by their current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderAnalytics?.ordersByStatus &&
                      Object.entries(orderAnalytics.ordersByStatus).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="flex items-center justify-between"
                          >
                            <span className="capitalize">{status}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (count /
                                        (orderAnalytics?.totalOrders || 1)) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <span className="font-medium w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.ordersByMachine")}</CardTitle>
                  <CardDescription>
                    Orders processed by each machine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderAnalytics?.ordersByMachine &&
                      Object.entries(orderAnalytics.ordersByMachine)
                        .slice(0, 5)
                        .map(([machine, count]) => (
                          <div
                            key={machine}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{machine}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="machines" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Machines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {machineAnalytics?.totalMachines || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Machines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {machineAnalytics?.activeMachines || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {machineAnalytics?.maintenanceRequired || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Average Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {machineAnalytics?.averageUptime?.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.machinePerformance")}</CardTitle>
                <CardDescription>
                  Performance metrics for each machine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {machineAnalytics?.machinePerformance?.map((machine) => (
                    <div key={machine.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">
                            {machine.serialNumber}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {machine.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {machine.uptime.toFixed(1)}% uptime
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Orders:{" "}
                          </span>
                          <span className="font-medium">
                            {machine.totalOrders}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Revenue:{" "}
                          </span>
                          <span className="font-medium">
                            ${machine.revenue}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.totalRevenue")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${revenueAnalytics?.totalRevenue || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.projectedRevenue")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${revenueAnalytics?.projectedRevenue || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">+12.5%</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.revenueByPaymentMethod")}</CardTitle>
                  <CardDescription>
                    Revenue breakdown by payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueAnalytics?.revenueByPaymentMethod &&
                      Object.entries(
                        revenueAnalytics.revenueByPaymentMethod
                      ).map(([method, amount]) => (
                        <div
                          key={method}
                          className="flex items-center justify-between"
                        >
                          <span className="capitalize">{method}</span>
                          <span className="font-medium">${amount}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("analytics.revenueByDay")}</CardTitle>
                  <CardDescription>Daily revenue trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {revenueAnalytics?.revenueByDay?.slice(-7).map((day) => (
                      <div key={day.date} className="flex justify-between">
                        <span className="text-sm">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <span className="font-medium">${day.revenue}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
