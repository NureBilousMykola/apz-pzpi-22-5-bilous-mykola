import { useState } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { DollarSign, Loader2, CreditCard } from "lucide-react";

const topUpSchema = z.object({
  amount: z.number().min(1, "Amount must be at least $1").max(1000, "Maximum top-up is $1000"),
});

type TopUpFormData = z.infer<typeof topUpSchema>;

interface TopUpDialogProps {
  trigger?: React.ReactNode;
  onTopUpComplete?: () => void;
  currentBalance?: number;
}

export function TopUpDialog({ trigger, onTopUpComplete, currentBalance }: TopUpDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<TopUpFormData>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      amount: 10,
    },
  });

  const watchedAmount = form.watch("amount");

  const onSubmit = async (data: TopUpFormData) => {
    try {
      setLoading(true);
      console.log("Starting wallet top-up process...", { amount: data.amount });

      // In a real app, this would integrate with a payment processor
      const result = await apiClient.topUpWallet(data.amount);
      console.log("Top-up successful:", result);

      // Close dialog first to prevent blank page issues
      setOpen(false);

      // Show success message
      alert(`Successfully added $${data.amount} to your wallet!`);

      // Call the callback after showing success message
      try {
        console.log("Calling onTopUpComplete callback...");
        await onTopUpComplete?.();
        console.log("onTopUpComplete callback completed successfully");
      } catch (callbackError) {
        console.error("Error in onTopUpComplete callback:", callbackError);
        // Don't let callback errors affect the user experience
        alert("Wallet topped up successfully, but there was an issue refreshing the balance. Please refresh the page.");
      }

    } catch (error: unknown) {
      console.error("Failed to top up wallet:", error);

      let errorMessage = "Failed to top up wallet. Please try again.";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.status === 404) {
          errorMessage = "Wallet not found. Please try creating a wallet first.";
        }
      } else if (error && typeof error === "object" && "message" in error) {
        const standardError = error as { message: string };
        errorMessage = standardError.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [5, 10, 25, 50, 100];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <DollarSign className="mr-2 h-4 w-4" />
            Top Up Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet to place orders
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Balance */}
            {currentBalance !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-2xl font-bold">
                    <DollarSign className="h-6 w-6" />
                    {currentBalance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Amount Buttons */}
            <div>
              <label className="text-sm font-medium">Quick Amounts</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("amount", amount)}
                    className={watchedAmount === amount ? "bg-primary text-primary-foreground" : ""}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        max="1000"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Balance Preview */}
            {currentBalance !== undefined && watchedAmount > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">New Balance:</span>
                    <span className="font-semibold text-green-800 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {(currentBalance + watchedAmount).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <CreditCard className="h-4 w-4" />
                  <span>This is a demo. In production, this would integrate with a real payment processor.</span>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || watchedAmount <= 0}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Add ${watchedAmount.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
