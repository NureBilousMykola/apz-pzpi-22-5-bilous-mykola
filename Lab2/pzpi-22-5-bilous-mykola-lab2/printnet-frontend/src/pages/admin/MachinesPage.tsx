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
import { Checkbox } from "@/components/ui/checkbox";
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
import type {
  VendingMachine,
  CreateVendingMachineRequest,
  UpdateVendingMachineRequest,
} from "@/types";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Wrench,
  WifiOff,
  HelpCircle,
} from "lucide-react";

export function MachinesPage() {
  const { t } = useTranslation();
  const [machines, setMachines] = useState<VendingMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMachine, setSelectedMachine] = useState<VendingMachine | null>(
    null
  );
  const [selectedMachineForEdit, setSelectedMachineForEdit] =
    useState<VendingMachine | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateVendingMachineRequest>({
    serial_number: "",
    location: "",
    printer_model: "",
    configuration: {},
  });
  const [editForm, setEditForm] = useState<UpdateVendingMachineRequest>({});

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "offline":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "unknown":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4" />;
      case "offline":
        return <WifiOff className="h-4 w-4" />;
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      case "unknown":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const handleUpdateMachineStatus = async (
    machineId: string,
    newStatus: string
  ) => {
    try {
      // Include basic telemetry data when updating status
      const telemetryData = {
        timestamp: new Date().toISOString(),
        updated_by: "admin",
        manual_update: true,
      };

      await apiClient.updateMachineStatus(machineId, newStatus, telemetryData);

      // Refresh machines
      const response = await apiClient.getVendingMachines(true);
      setMachines(response.data);

      // Update the selected machine if it's the one being updated
      if (selectedMachine && selectedMachine.id === machineId) {
        const updatedMachine = response.data.find((m) => m.id === machineId);
        if (updatedMachine) {
          setSelectedMachine(updatedMachine);
        }
      }

      // Show success message
      console.log(`Machine status updated to ${newStatus}`);
    } catch (err) {
      console.error("Failed to update machine status:", err);
      alert(t("machines.statusUpdateFailed"));
    }
  };

  const handleCreateMachine = async () => {
    try {
      await apiClient.createMachine(createForm);
      setIsCreateOpen(false);
      setCreateForm({
        serial_number: "",
        location: "",
        printer_model: "",
        configuration: {},
      });
      // Refresh machines
      const response = await apiClient.getVendingMachines(true);
      setMachines(response.data);
    } catch (err) {
      console.error("Failed to create machine:", err);
    }
  };

  const handleEditMachine = async () => {
    if (!selectedMachineForEdit) return;
    try {
      await apiClient.updateMachine(selectedMachineForEdit.id, editForm);
      setIsEditOpen(false);
      setEditForm({});
      setSelectedMachineForEdit(null);
      // Refresh machines
      const response = await apiClient.getVendingMachines(true);
      setMachines(response.data);
    } catch (err) {
      console.error("Failed to update machine:", err);
      alert("Failed to update machine. Please try again.");
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    if (!confirm(t("machines.confirmDelete"))) return;
    try {
      await apiClient.deleteVendingMachine(machineId);
      // Refresh machines
      const response = await apiClient.getVendingMachines(true);
      setMachines(response.data);
      console.log("Machine deleted successfully");
    } catch (err) {
      console.error("Failed to delete machine:", err);
      alert("Failed to delete machine. Please try again.");
    }
  };

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch =
      machine.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchTerm.toLowerCase());

    const currentStatus =
      machine.statuses?.[machine.statuses.length - 1]?.status || "unknown";
    const matchesStatus =
      statusFilter === "all" || currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalMachines = machines.length;
  const activeMachines = machines.filter((m) => {
    const status = m.statuses?.[m.statuses.length - 1]?.status;
    return status === "online";
  }).length;
  const maintenanceMachines = machines.filter(
    (m) => m.maintenance_required
  ).length;
  const errorMachines = machines.filter((m) => {
    const status = m.statuses?.[m.statuses.length - 1]?.status;
    return status === "error";
  }).length;

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
            {t("machines.title")}
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor all vending machines
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("machines.addMachine")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Machine</DialogTitle>
              <DialogDescription>
                Create a new vending machine in the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Serial Number</label>
                <Input
                  value={createForm.serial_number}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      serial_number: e.target.value,
                    })
                  }
                  placeholder="VM123456"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={createForm.location}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, location: e.target.value })
                  }
                  placeholder="Main Street 123"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Printer Model</label>
                <Input
                  value={createForm.printer_model}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      printer_model: e.target.value,
                    })
                  }
                  placeholder="Model X"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateMachine}>Create Machine</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Machines
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMachines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMachines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Required
            </CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceMachines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorMachines}</div>
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
                  placeholder="Search machines..."
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
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Machines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vending Machines</CardTitle>
          <CardDescription>
            A list of all vending machines in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines.map((machine) => {
                  const currentStatus =
                    machine.statuses?.[machine.statuses.length - 1];
                  const statusValue = currentStatus?.status || "unknown";

                  return (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium">
                        {machine.serial_number}
                      </TableCell>
                      <TableCell>{machine.location}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(statusValue)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(statusValue)}
                            {t(`machines.${statusValue}`)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {machine.maintenance_required ? (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            Required
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Up to date
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {currentStatus
                          ? new Date(
                              currentStatus.created_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog
                            open={isDetailsOpen}
                            onOpenChange={(open) => {
                              setIsDetailsOpen(open);
                              if (!open) {
                                setSelectedMachine(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedMachine(machine)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Machine Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about{" "}
                                  {selectedMachine?.serial_number}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedMachine && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">
                                        Serial Number
                                      </label>
                                      <p>{selectedMachine.serial_number}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">
                                        Location
                                      </label>
                                      <p>{selectedMachine.location}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Status
                                    </label>
                                    <div className="mt-1">
                                      <Select
                                        value={
                                          selectedMachine.statuses?.[
                                            selectedMachine.statuses.length - 1
                                          ]?.status || "unknown"
                                        }
                                        onValueChange={(value) =>
                                          handleUpdateMachineStatus(
                                            selectedMachine.id,
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-[200px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="online">
                                            {t("machines.online")}
                                          </SelectItem>
                                          <SelectItem value="offline">
                                            {t("machines.offline")}
                                          </SelectItem>
                                          <SelectItem value="maintenance">
                                            {t("machines.maintenance")}
                                          </SelectItem>
                                          <SelectItem value="error">
                                            {t("machines.error")}
                                          </SelectItem>
                                          <SelectItem value="unknown">
                                            {t("machines.unknown")}
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">
                                        Active
                                      </label>
                                      <p>
                                        {selectedMachine.is_active
                                          ? "Yes"
                                          : "No"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">
                                        Maintenance Required
                                      </label>
                                      <p>
                                        {selectedMachine.maintenance_required
                                          ? "Yes"
                                          : "No"}
                                      </p>
                                    </div>
                                  </div>
                                  {selectedMachine.statuses?.[
                                    selectedMachine.statuses.length - 1
                                  ]?.telemetry && (
                                    <div>
                                      <label className="text-sm font-medium">
                                        Telemetry
                                      </label>
                                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                        {JSON.stringify(
                                          selectedMachine.statuses[
                                            selectedMachine.statuses.length - 1
                                          ].telemetry,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Dialog
                            open={isEditOpen}
                            onOpenChange={(open) => {
                              setIsEditOpen(open);
                              if (!open) {
                                setSelectedMachineForEdit(null);
                                setEditForm({});
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMachineForEdit(machine);
                                  setEditForm({
                                    location: machine.location,
                                    is_active: machine.is_active,
                                    maintenance_required:
                                      machine.maintenance_required,
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Machine</DialogTitle>
                                <DialogDescription>
                                  Update machine information
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">
                                    Location
                                  </label>
                                  <Input
                                    value={editForm.location || ""}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        location: e.target.value,
                                      })
                                    }
                                  />
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={editForm.is_active || false}
                                    onCheckedChange={(checked) =>
                                      setEditForm({
                                        ...editForm,
                                        is_active: checked as boolean,
                                      })
                                    }
                                  />
                                  <label className="text-sm font-medium">
                                    Active
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={
                                      editForm.maintenance_required || false
                                    }
                                    onCheckedChange={(checked) =>
                                      setEditForm({
                                        ...editForm,
                                        maintenance_required:
                                          checked as boolean,
                                      })
                                    }
                                  />
                                  <label className="text-sm font-medium">
                                    Maintenance Required
                                  </label>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsEditOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleEditMachine}>
                                    Update Machine
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMachine(machine.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
