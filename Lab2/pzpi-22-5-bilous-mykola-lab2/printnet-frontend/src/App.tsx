import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/authStore";

// Auth pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";

// Client pages
import { ClientDashboard } from "@/pages/client/Dashboard";
import { OrdersPage as ClientOrdersPage } from "@/pages/client/OrdersPage";
import { MachinesPage as ClientMachinesPage } from "@/pages/client/MachinesPage";
import { ProfilePage } from "@/pages/client/ProfilePage";

// Admin pages
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { UsersPage } from "@/pages/admin/UsersPage";
import { OrdersPage as AdminOrdersPage } from "@/pages/admin/OrdersPage";
import { MachinesPage as AdminMachinesPage } from "@/pages/admin/MachinesPage";
import { AnalyticsPage } from "@/pages/admin/AnalyticsPage";

// Import i18n
import "@/i18n";

function App() {
  const { loadUser, isAuthenticated, isAdmin } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="printnet-ui-theme">
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <RegisterPage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Client routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute requireClient={true}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute requireClient={true}>
                  <ClientOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="machines"
              element={
                <ProtectedRoute requireClient={true}>
                  <ClientMachinesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute requireClient={true}>
                  <div>Payments Page (Coming Soon)</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute requireClient={true}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/orders"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/machines"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminMachinesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/products"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <div>Admin Products Page (Coming Soon)</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/payments"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <div>Admin Payments Page (Coming Soon)</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/settings"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <div>Admin Settings Page (Coming Soon)</div>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Default redirects */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate
                  to={isAdmin() ? "/admin/dashboard" : "/dashboard"}
                  replace
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
