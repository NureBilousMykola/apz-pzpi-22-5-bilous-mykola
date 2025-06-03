import { type ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireClient?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireClient = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, loadUser, isAdmin, isClient } =
    useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user && localStorage.getItem("auth_token")) {
      loadUser();
    }
  }, [user, loadUser]);

  // Add debugging for login issues
  if (
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/admin")
  ) {
    console.log("ProtectedRoute check:", {
      path: location.pathname,
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      requireAuth,
      requireAdmin,
      requireClient,
      isAdmin: isAdmin(),
      isClient: isClient(),
      userRoles: user?.roles,
    });
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    console.log("Redirecting to login - not authenticated");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if user is authenticated but trying to access auth pages
  if (!requireAuth && isAuthenticated) {
    console.log("Redirecting to dashboard - authenticated user on auth page");
    return <Navigate to="/dashboard" replace />;
  }

  // Check admin role requirement
  if (requireAdmin && !isAdmin()) {
    console.log(
      "Redirecting to dashboard - admin required but user is not admin"
    );
    return <Navigate to="/dashboard" replace />;
  }

  // Check client role requirement
  if (requireClient && !isClient()) {
    console.log(
      "Redirecting to admin dashboard - client required but user is not client"
    );
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log("ProtectedRoute allowing access");
  return <>{children}</>;
}
