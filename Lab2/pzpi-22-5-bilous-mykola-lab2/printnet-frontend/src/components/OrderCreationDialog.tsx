import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopUpDialog } from "@/components/TopUpDialog";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type {
  VendingMachine,
  CreateOrderRequest,
  CreatePaymentRequest,
  PrintSettings,
} from "@/types";
import {
  Upload,
  FileText,
  Printer,
  MapPin,
  DollarSign,
  Loader2,
  CheckCircle,
} from "lucide-react";

const orderSchema = z.object({
  machineId: z.string().min(1, "Please select a machine"),
  modelFile: z.instanceof(File, { message: "Please upload a 3D model file" }),
  material: z.string().min(1, "Please select a material"),
  infill: z.number().min(5).max(100, "Infill must be between 5% and 100%"),
  layerHeight: z
    .number()
    .min(0.1)
    .max(0.5, "Layer height must be between 0.1mm and 0.5mm"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderCreationDialogProps {
  trigger?: React.ReactNode;
  selectedMachineId?: string;
  onOrderCreated?: () => void;
}

export function OrderCreationDialog({
  trigger,
  selectedMachineId,
  onOrderCreated,
}: OrderCreationDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [machines, setMachines] = useState<VendingMachine[]>([]);
  const [loading, setLoading] = useState(false);
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [step, setStep] = useState<
    "machine" | "file" | "settings" | "review" | "success"
  >("machine");
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      machineId: selectedMachineId || "",
      material: "PLA",
      infill: 20,
      layerHeight: 0.2,
      quantity: 1,
      notes: "",
    },
  });

  const watchedValues = form.watch();

  const calculateEstimatedCost = useCallback(() => {
    console.log("calculateEstimatedCost called with:", {
      material: watchedValues.material,
      infill: watchedValues.infill,
      layerHeight: watchedValues.layerHeight,
      quantity: watchedValues.quantity,
    });

    // Ensure all values are valid
    if (
      !watchedValues.material ||
      typeof watchedValues.infill !== 'number' || watchedValues.infill <= 0 ||
      typeof watchedValues.layerHeight !== 'number' || watchedValues.layerHeight <= 0 ||
      typeof watchedValues.quantity !== 'number' || watchedValues.quantity <= 0
    ) {
      console.log("Missing or invalid required values for cost calculation");
      return;
    }

    // Simple cost calculation - in real app this would be more sophisticated
    const baseCost = 5.0;
    const materialCosts = { PLA: 0.05, ABS: 0.06, PETG: 0.07, TPU: 0.08 };
    const materialCost =
      materialCosts[watchedValues.material as keyof typeof materialCosts] ||
      0.05;
    const infillMultiplier = watchedValues.infill / 100;
    const layerMultiplier = 1 / watchedValues.layerHeight;

    const estimated =
      (baseCost + materialCost * 100 * infillMultiplier * layerMultiplier) *
      watchedValues.quantity;

    const finalCost = Math.round(estimated * 100) / 100;
    console.log("Calculated cost:", finalCost);
    setEstimatedCost(finalCost);
  }, [watchedValues]);

  // Auto-calculate cost when relevant values change
  useEffect(() => {
    if (
      watchedValues.material &&
      typeof watchedValues.infill === 'number' && watchedValues.infill > 0 &&
      typeof watchedValues.layerHeight === 'number' && watchedValues.layerHeight > 0 &&
      typeof watchedValues.quantity === 'number' && watchedValues.quantity > 0 &&
      step === "review"
    ) {
      calculateEstimatedCost();
    }
  }, [
    watchedValues.material,
    watchedValues.infill,
    watchedValues.layerHeight,
    watchedValues.quantity,
    step,
    calculateEstimatedCost,
  ]);

  // Load machines when dialog opens
  const loadMachines = async () => {
    try {
      setMachinesLoading(true);
      const response = await apiClient.getVendingMachines();
      setMachines(
        response.data.filter(
          (machine) => machine.is_active && !machine.maintenance_required
        )
      );
    } catch (error) {
      console.error("Failed to load machines:", error);
    } finally {
      setMachinesLoading(false);
    }
  };

  // Load wallet balance
  const loadWalletBalance = async () => {
    if (!user?.id) return;

    try {
      const balance = await apiClient.getWalletBalance();
      setWalletBalance(balance);
    } catch (error: unknown) {
      console.log("Wallet balance error:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          try {
            await apiClient.createWallet();
            setWalletBalance(0);
          } catch (createError) {
            console.error("Failed to create wallet:", createError);
            setWalletBalance(0);
          }
        } else {
          setWalletBalance(0);
        }
      } else {
        setWalletBalance(0);
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadMachines();
      loadWalletBalance();
      setStep("machine");
      setCreatedOrderId(null);
      form.reset({
        machineId: selectedMachineId || "",
        material: "PLA",
        infill: 20,
        layerHeight: 0.2,
        quantity: 1,
        notes: "",
      });
    } else if (step === "success") {
      onOrderCreated?.();
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    if (!user?.id) {
      console.error("User not authenticated");
      alert("Please log in to create an order");
      return;
    }

    if (!estimatedCost) {
      console.error("Cost not calculated");
      alert("Please wait for cost calculation");
      return;
    }

    if (walletBalance !== null && walletBalance < estimatedCost) {
      alert("Insufficient funds. Please top up your wallet first.");
      return;
    }

    try {
      setLoading(true);

      const timestamp = Date.now();
      const modelFileUrl = `uploads/${user.id}/${timestamp}_${data.modelFile.name}`;

      const printSettings: PrintSettings = {
        material: data.material,
        infill: data.infill,
        layerHeight: data.layerHeight,
        notes: data.notes || "",
        fileName: data.modelFile.name,
        fileSize: data.modelFile.size,
        quantity: data.quantity,
      };

      const orderData: CreateOrderRequest = {
        customer_id: user.id,
        product_id: "3d-print-service",
        quantity: data.quantity,
        machine_id: data.machineId,
        cost: estimatedCost,
        model_file_url: modelFileUrl,
        print_settings: printSettings,
      };

      console.log("Order data being sent:", JSON.stringify(orderData, null, 2));

      const orderResponse = await apiClient.createOrder(orderData);

      const paymentData: CreatePaymentRequest = {
        order_id: orderResponse.data.id,
        amount: estimatedCost,
        payment_method: "wallet",
      };

      await apiClient.createPayment(paymentData);
      await loadWalletBalance();

      setCreatedOrderId(orderResponse.data.id);
      setStep("success");
    } catch (error: unknown) {
      console.error("Failed to create order:", error);

      // Log the full error details for debugging
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: unknown;
            status?: number;
          };
        };
        console.error("Error response data:", axiosError.response?.data);
        console.error("Error response status:", axiosError.response?.status);
      }

      let errorMessage = "Failed to create order. Please try again.";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: { message?: string; error?: string };
            status?: number;
          };
        };

        if (axiosError.response?.status === 400) {
          if (
            axiosError.response.data?.message?.includes("Недостатньо коштів")
          ) {
            errorMessage =
              "Insufficient funds in your wallet. Please top up your wallet first.";
          } else if (axiosError.response.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        } else if (axiosError.response?.status === 404) {
          errorMessage =
            "Selected machine not found. Please choose another machine.";
        } else if (axiosError.response?.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        }
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedMachine = machines.find(
    (m) => m.id === watchedValues.machineId
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            {t("orders.createOrder", "Create Order")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("orders.createNewOrder", "Create New Order")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "orders.uploadModelDescription",
              "Upload your 3D model and configure print settings"
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step indicator */}
            {step !== "success" && (
              <div className="flex items-center justify-between">
                {["machine", "file", "settings", "review"].map(
                  (stepName, index) => (
                    <div
                      key={stepName}
                      className={`flex items-center ${
                        index < 3 ? "flex-1" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step === stepName
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < 3 && (
                        <div className="flex-1 h-px bg-muted mx-2" />
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Machine Selection Step */}
            {step === "machine" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("orders.selectMachine", "Select Machine")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "orders.choosePrinter",
                                "Choose a 3D printer"
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {machinesLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            machines.map((machine) => (
                              <SelectItem key={machine.id} value={machine.id}>
                                <div className="flex items-center gap-2">
                                  <Printer className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">
                                      {machine.serial_number}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {machine.location}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedMachine && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Selected Machine
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          <span className="font-medium">
                            {selectedMachine.serial_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">
                            {selectedMachine.location}
                          </span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="secondary">Available</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* File Upload Step */}
            {step === "file" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="modelFile"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>
                        {t("orders.modelFile", "3D Model File")}
                      </FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                          <Input
                            type="file"
                            accept=".stl,.obj,.3mf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onChange(file);
                            }}
                            className="hidden"
                            id="file-upload"
                            {...field}
                          />
                          <Label
                            htmlFor="file-upload"
                            className="cursor-pointer"
                          >
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <div className="text-sm">
                                {value ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">
                                      {value.name}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-medium">
                                      Click to upload your 3D model
                                    </div>
                                    <div className="text-muted-foreground">
                                      Supports STL, OBJ, 3MF files
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </Label>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload your 3D model file. Maximum file size: 50MB
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Settings Step */}
            {step === "settings" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PLA">PLA</SelectItem>
                            <SelectItem value="ABS">ABS</SelectItem>
                            <SelectItem value="PETG">PETG</SelectItem>
                            <SelectItem value="TPU">TPU</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="infill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Infill (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="5"
                            max="100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="layerHeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Layer Height (mm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="0.5"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions or notes..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Review Step */}
            {step === "review" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Machine:</span>
                      <span className="font-medium">
                        {selectedMachine?.serial_number || "Not selected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>File:</span>
                      <span className="font-medium">
                        {watchedValues.modelFile?.name || "No file selected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Material:</span>
                      <span>{watchedValues.material || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Infill:</span>
                      <span>{watchedValues.infill || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Layer Height:</span>
                      <span>{watchedValues.layerHeight || 0}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{watchedValues.quantity || 0}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Estimated Cost:</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {estimatedCost !== null ? `$${estimatedCost.toFixed(2)}` : "Calculating..."}
                      </span>
                    </div>
                    {walletBalance !== null && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span>Wallet Balance:</span>
                        <span
                          className={`flex items-center gap-1 ${
                            walletBalance < (estimatedCost || 0)
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          <DollarSign className="h-3 w-3" />${walletBalance.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {walletBalance !== null &&
                      estimatedCost &&
                      walletBalance < estimatedCost && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                          <div className="font-medium">Insufficient Funds</div>
                          <div>
                            You need $
                            {(estimatedCost - walletBalance).toFixed(2)} more to
                            place this order.
                          </div>
                          <div className="mt-2">
                            <TopUpDialog
                              currentBalance={walletBalance}
                              onTopUpComplete={() => {
                                loadWalletBalance();
                              }}
                              trigger={
                                <button
                                  type="button"
                                  className="text-red-600 underline hover:text-red-800"
                                >
                                  Top up wallet
                                </button>
                              }
                            />
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>

                {/* Debug information in development */}
                {process.env.NODE_ENV === 'development' && (
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-xs">Debug Info</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      <div>Step: {step}</div>
                      <div>Estimated Cost: {estimatedCost}</div>
                      <div>Wallet Balance: {walletBalance}</div>
                      <div>Material: {watchedValues.material}</div>
                      <div>Infill: {watchedValues.infill} (type: {typeof watchedValues.infill})</div>
                      <div>Layer Height: {watchedValues.layerHeight} (type: {typeof watchedValues.layerHeight})</div>
                      <div>Quantity: {watchedValues.quantity} (type: {typeof watchedValues.quantity})</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Success Step */}
            {step === "success" && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-800">
                    Order Created Successfully!
                  </h3>
                  <p className="text-muted-foreground">
                    Your 3D printing order has been submitted and payment has
                    been processed.
                  </p>
                  {createdOrderId && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <div className="font-medium text-green-800">
                        Order ID:
                      </div>
                      <div className="text-green-700 font-mono">
                        {createdOrderId}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            {step === "success" ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Close
                </Button>
              </div>
            ) : (
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const steps = ["machine", "file", "settings", "review"];
                    const currentIndex = steps.indexOf(step);
                    if (currentIndex > 0) {
                      setStep(steps[currentIndex - 1] as typeof step);
                    }
                  }}
                  disabled={step === "machine"}
                >
                  Previous
                </Button>

                {step !== "review" ? (
                  <Button
                    type="button"
                    onClick={() => {
                      const steps = ["machine", "file", "settings", "review"];
                      const currentIndex = steps.indexOf(step);
                      if (currentIndex < steps.length - 1) {
                        const nextStep = steps[currentIndex + 1];
                        setStep(nextStep as typeof step);
                        // Calculate cost when moving to review step
                        if (nextStep === "review") {
                          setTimeout(() => calculateEstimatedCost(), 100);
                        }
                      }
                    }}
                    disabled={
                      (step === "machine" && !watchedValues.machineId) ||
                      (step === "file" && !watchedValues.modelFile) ||
                      (step === "settings" &&
                        (!watchedValues.material ||
                          typeof watchedValues.infill !== 'number' || watchedValues.infill <= 0 ||
                          typeof watchedValues.layerHeight !== 'number' || watchedValues.layerHeight <= 0 ||
                          typeof watchedValues.quantity !== 'number' || watchedValues.quantity <= 0))
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      (walletBalance !== null &&
                        estimatedCost !== null &&
                        walletBalance < estimatedCost)
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Order...
                      </>
                    ) : walletBalance !== null &&
                      estimatedCost !== null &&
                      walletBalance < estimatedCost ? (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Insufficient Funds
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create Order
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
