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
import type { VendingMachine } from "@/types";
import {
  Search,
  Filter,
  MapPin,
  Printer,
  Thermometer,
  Droplets,
  CheckCircle,
  AlertTriangle,
  Plus,
  Loader2,
} from "lucide-react";

export function MachinesPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [machines, setMachines] = useState<VendingMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getVendingMachines(true); // Include inactive machines
        setMachines(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch machines:", err);
        setError("Failed to load machines");
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  const refreshMachines = async () => {
    try {
      const response = await apiClient.getVendingMachines(true);
      setMachines(response.data);
    } catch (err) {
      console.error("Failed to refresh machines:", err);
    }
  };

  const getStatusText = (machine: VendingMachine) => {
    if (!machine.is_active) return "inactive";
    if (machine.maintenance_required) return "maintenance";
    return "active";
  };

  const getStatusColor = (machine: VendingMachine) => {
    const status = getStatusText(machine);
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (machine: VendingMachine) => {
    const status = getStatusText(machine);
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "maintenance":
        return <AlertTriangle className="h-4 w-4" />;
      case "inactive":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredMachines = machines.filter((machine) => {
    const status = getStatusText(machine);
    const matchesSearch =
      machine.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableMachines = machines.filter(
    (m) => m.is_active && !m.maintenance_required
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("machines.title")}
          </h1>
          <p className="text-muted-foreground">
            Find and monitor 3D printing vending machines near you
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            Available Machines
          </div>
          <div className="text-2xl font-bold text-green-600">
            {availableMachines.length}
          </div>
        </div>
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
                  placeholder="Search by location or machine ID..."
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
                <SelectItem value="active">{t("machines.active")}</SelectItem>
                <SelectItem value="maintenance">
                  {t("machines.maintenance")}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("machines.inactive")}
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
          <span className="ml-2">Loading machines...</span>
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

      {/* Machines Grid */}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMachines.map((machine) => {
            const status = getStatusText(machine);
            const latestStatus = machine.statuses?.[0];
            const latestTelemetry = latestStatus?.telemetry || {};

            return (
              <Card
                key={machine.id}
                className={
                  status === "active"
                    ? "border-green-200 dark:border-green-800"
                    : ""
                }
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        {machine.serial_number}
                      </CardTitle>
                      <CardDescription>{machine.location}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(machine)}>
                      {getStatusIcon(machine)}
                      <span className="ml-1">{t(`machines.${status}`)}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location */}
                  <div>
                    <h4 className="font-medium mb-1">Location</h4>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {machine.location}
                      </div>
                    </div>
                  </div>

                  {/* Printer Info */}
                  <div>
                    <h4 className="font-medium mb-1">Printer Details</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Serial: {machine.serial_number}</div>
                      <div>Status: {latestStatus?.status || "Unknown"}</div>
                      {machine.printer_configs?.[0] && (
                        <div>Config: Available</div>
                      )}
                    </div>
                  </div>

                  {/* Status Info */}
                  <div>
                    <h4 className="font-medium mb-1">Current Status</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {status === "active" ? (
                        <div className="text-green-600">
                          Available for new orders
                        </div>
                      ) : status === "maintenance" ? (
                        <div className="text-yellow-600">Under maintenance</div>
                      ) : (
                        <div className="text-red-600">Currently offline</div>
                      )}
                      {latestStatus && (
                        <div className="text-xs">
                          Last updated:{" "}
                          {new Date(latestStatus.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Telemetry */}
                  {latestTelemetry &&
                    Object.keys(latestTelemetry).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-1">Environment</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {latestTelemetry.temperature && (
                            <div className="text-center">
                              <Thermometer className="h-4 w-4 mx-auto mb-1" />
                              <div className="text-xs text-muted-foreground">
                                Temp
                              </div>
                              <div className="font-medium">
                                {latestTelemetry.temperature}°C
                              </div>
                            </div>
                          )}
                          {latestTelemetry.humidity && (
                            <div className="text-center">
                              <Droplets className="h-4 w-4 mx-auto mb-1" />
                              <div className="text-xs text-muted-foreground">
                                Humidity
                              </div>
                              <div className="font-medium">
                                {latestTelemetry.humidity}%
                              </div>
                            </div>
                          )}
                          {latestTelemetry.filamentLevel && (
                            <div className="text-center">
                              <div className="h-4 w-4 mx-auto mb-1 bg-blue-500 rounded-full"></div>
                              <div className="text-xs text-muted-foreground">
                                Filament
                              </div>
                              <div className="font-medium">
                                {latestTelemetry.filamentLevel}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="pt-2">
                    {status === "active" ? (
                      <OrderCreationDialog
                        selectedMachineId={machine.id}
                        onOrderCreated={refreshMachines}
                        trigger={
                          <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Order Here
                          </Button>
                        }
                      />
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        {status === "maintenance"
                          ? "Under Maintenance"
                          : "Unavailable"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredMachines.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              No machines found matching your criteria.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
