import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  ShoppingCart,
  Printer,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  User,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAdmin, logout } = useAuthStore();

  const clientNavItems = [
    {
      title: t("nav.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("nav.orders"),
      href: "/orders",
      icon: ShoppingCart,
    },
    {
      title: t("nav.machines"),
      href: "/machines",
      icon: Printer,
    },
    {
      title: t("nav.payments"),
      href: "/payments",
      icon: CreditCard,
    },
    {
      title: t("nav.profile"),
      href: "/profile",
      icon: User,
    },
  ];

  const adminNavItems = [
    {
      title: t("nav.dashboard"),
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("nav.orders"),
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      title: t("nav.users"),
      href: "/admin/users",
      icon: Users,
    },
    {
      title: t("nav.machines"),
      href: "/admin/machines",
      icon: Printer,
    },
    {
      title: t("nav.payments"),
      href: "/admin/payments",
      icon: CreditCard,
    },
    {
      title: t("nav.analytics"),
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: t("nav.settings"),
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const navItems = isAdmin() ? adminNavItems : clientNavItems;

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-6">
            <h1 className="text-2xl font-bold text-primary">PrintNet</h1>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-1">
            <button
              onClick={logout}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
