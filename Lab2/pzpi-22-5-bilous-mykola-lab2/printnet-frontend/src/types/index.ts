// User types
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
}

export interface UserRole {
  id: string;
  role: "client" | "admin";
  created_at: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: "client" | "admin";
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Order types
export interface Order {
  id: string;
  user: User;
  machine: VendingMachine;
  model_file_url: string;
  print_settings: PrintSettings;
  estimated_completion_time?: string;
  actual_completion_time?: string;
  cost: string;
  created_at: string;
  updated_at: string;
  statuses: OrderStatus[];
  payments: Payment[];
}

export interface OrderStatus {
  id: string;
  status:
    | "created"
    | "pending"
    | "processing"
    | "printing"
    | "completed"
    | "failed"
    | "cancelled";
  description?: string;
  created_at: string;
}

export interface PrintSettings {
  material: string;
  infill: number;
  layerHeight: number;
  notes: string;
  fileName: string;
  fileSize: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customer_id: string;
  product_id: string;
  quantity: number;
  machine_id: string;
  cost: number;
  model_file_url: string;
  print_settings: PrintSettings;
}

// Vending Machine types
export interface VendingMachine {
  id: string;
  serial_number: string;
  location: string;
  is_active: boolean;
  maintenance_required: boolean;
  created_at: string;
  updated_at: string;
  printer_configs: PrinterConfig[];
  statuses: DeviceStatus[];
}

export interface PrinterConfig {
  id: string;
  machine_id: string;
  configuration: Record<string, undefined>;
}

export interface DeviceStatus {
  id: string;
  machine_id: string;
  status: "online" | "offline" | "maintenance" | "error" | "unknown";
  telemetry: Record<string, undefined>;
  created_at: string;
}

// Payment types
export interface Payment {
  id: string;
  amount: string;
  payment_method: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  created_at: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  amount: number;
  payment_method: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  last_transaction: string | null;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface OrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  machineId?: string;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

// Admin Dashboard types
export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeMachines: number;
  maintenanceRequired: number;
}

export interface MachineMetrics {
  id: string;
  serialNumber: string;
  location: string;
  status: string;
  lastMaintenance: string;
  totalOrders: number;
  revenue: number;
  uptime: number;
}

export interface DashboardData {
  systemMetrics: SystemMetrics;
  machineMetrics: MachineMetrics[];
  recentOrders: Order[];
  alerts: MachineAlert[];
}

export interface MachineAlert {
  id: string;
  location: string;
  issue: string;
  severity: "warning" | "error";
}

// Client Dashboard types
export interface ClientStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
}

// Analytics types
export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByMachine: Record<string, number>;
  peakOrderTimes: Record<string, number>;
}

export interface MachineAnalytics {
  totalMachines: number;
  activeMachines: number;
  maintenanceRequired: number;
  averageUptime: number;
  machinePerformance: Array<{
    id: string;
    serialNumber: string;
    location: string;
    uptime: number;
    totalOrders: number;
    revenue: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByDay: Array<{ date: string; revenue: number }>;
  revenueByPaymentMethod: Record<string, number>;
  projectedRevenue: number;
}

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  machineId?: string;
  reportType?: "daily" | "weekly" | "monthly" | "custom";
}

// Create/Update DTOs
export interface CreateVendingMachineRequest {
  serial_number: string;
  location: string;
  printer_model: string;
  configuration: Record<string, undefined>;
}

export interface UpdateVendingMachineRequest {
  location?: string;
  configuration?: Record<string, undefined>;
  is_active?: boolean;
  maintenance_required?: boolean;
}

export interface UpdateOrderStatusRequest {
  status: string;
  description?: string;
}

export interface GenerateReportRequest {
  startDate: string;
  endDate: string;
  reportType: "daily" | "weekly" | "monthly" | "custom";
  machineId?: string;
}

export interface Report {
  id: string;
  type: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  data: Record<string, undefined>;
  format: string;
}

// Theme and Language types
export type Theme = "light" | "dark" | "system";
export type Language = "en" | "ua";
