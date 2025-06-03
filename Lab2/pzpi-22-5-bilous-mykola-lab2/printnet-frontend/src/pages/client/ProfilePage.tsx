import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TopUpDialog } from "@/components/TopUpDialog";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api";
import type { ClientStats } from "@/types";
import {
  User,
  Mail,
  // Phone,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  ShoppingCart,
  DollarSign,
  Loader2,
} from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, loadUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!user?.id) return;

      try {
        const balance = await apiClient.getWalletBalance();
        // Ensure balance is a number
        const numericBalance = typeof balance === 'number' ? balance : parseFloat(balance) || 0;
        setWalletBalance(numericBalance);
      } catch (error) {
        console.log("Wallet balance error:", error);
        // If wallet doesn't exist, try to create it
        try {
          console.log("Attempting to create wallet for new user...");
          await apiClient.createWallet();
          setWalletBalance(0);
          console.log("Wallet created successfully");
        } catch (createError) {
          console.error("Failed to create wallet:", createError);
          // Set balance to 0 as fallback to prevent UI issues
          setWalletBalance(0);
        }
      }
    };

    const loadClientStats = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingStats(true);
        const response = await apiClient.getClientStats(user.id);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to load client stats:", error);
        // Set default stats if API call fails
        setStats({
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          totalSpent: 0,
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    // Load data with a small delay to ensure user is fully loaded
    const timeoutId = setTimeout(() => {
      loadWalletBalance();
      loadClientStats();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user?.id]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await apiClient.updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
      });
      setIsEditing(false);
      // Refresh user data in auth store
      try {
        await loadUser();
      } catch (loadError) {
        console.error("Failed to reload user data:", loadError);
        // Don't let this error affect the form submission success
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    try {
      reset();
      setIsEditing(false);
    } catch (error) {
      console.error("Error canceling edit:", error);
      setIsEditing(false); // At least reset the editing state
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getUserRoles = () => {
    return user?.roles?.map((r) => r.role) || [];
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  try {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("nav.profile")}
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Information */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit(onSubmit)}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${user?.email}`}
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(user?.first_name, user?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">
                      {user?.first_name} {user?.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <div className="flex gap-1 mt-2">
                      {getUserRoles().map((role) => (
                        <Badge
                          key={role}
                          variant={role === "admin" ? "default" : "secondary"}
                        >
                          {role === "admin" ? (
                            <Shield className="mr-1 h-3 w-3" />
                          ) : (
                            <User className="mr-1 h-3 w-3" />
                          )}
                          {t(`users.${role}`)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                      <Input
                        id="firstName"
                        {...register("firstName")}
                        disabled={!isEditing}
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-500">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                      <Input
                        id="lastName"
                        {...register("lastName")}
                        disabled={!isEditing}
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-500">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      disabled={!isEditing}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("auth.phone")}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      disabled={!isEditing}
                      placeholder="+1234567890"
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View your account details and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Member Since</div>
                      <div className="text-sm text-muted-foreground">
                        {user?.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Wallet Balance */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Balance</CardTitle>
                <CardDescription>Your current account balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span className="text-2xl font-bold">
                      {walletBalance !== null && typeof walletBalance === 'number'
                        ? `$${walletBalance.toFixed(2)}`
                        : "Loading..."}
                    </span>
                  </div>
                </div>
                <TopUpDialog
                  currentBalance={typeof walletBalance === 'number' ? walletBalance : 0}
                  onTopUpComplete={async () => {
                    try {
                      // Reload wallet balance
                      if (user?.id) {
                        const balance = await apiClient.getWalletBalance();
                        // Ensure balance is a number
                        const numericBalance = typeof balance === 'number' ? balance : parseFloat(balance) || 0;
                        setWalletBalance(numericBalance);
                      }
                    } catch (error) {
                      console.error("Failed to reload wallet balance:", error);
                      // Don't throw the error, just log it to prevent blank page
                      // The user can refresh manually if needed
                    }
                  }}
                  trigger={
                    <Button className="w-full">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Top Up Wallet
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Statistics</CardTitle>
                <CardDescription>Your printing activity overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Orders</span>
                      </div>
                      <span className="font-medium">{stats?.totalOrders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Spent</span>
                      </div>
                      <span className="font-medium">${stats?.totalSpent || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Completed</span>
                      </div>
                      <span className="font-medium">{stats?.completedOrders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Active</span>
                      </div>
                      <span className="font-medium">{stats?.activeOrders || 0}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  View Order History
                </Button>
                <Button className="w-full" variant="outline">
                  Find Machines
                </Button>
                <Button className="w-full" variant="outline">
                  Payment Methods
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering ProfilePage:", error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
}
