import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Order,
  VendingMachine,
  Payment,
  Wallet,
  ApiResponse,
  CreateOrderRequest,
  CreatePaymentRequest,
  OrderFilters,
  UserFilters,
  DashboardData,
  ClientStats,
  OrderAnalytics,
  MachineAnalytics,
  RevenueAnalytics,
  AnalyticsFilters,
  CreateVendingMachineRequest,
  UpdateVendingMachineRequest,
  UpdateOrderStatusRequest,
  GenerateReportRequest,
  Report,
  CreateUserRequest,
} from "@/types";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 second timeout
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        // Retry logic for network errors
        if (
          (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') &&
          config &&
          !config._retry &&
          config._retryCount < 3
        ) {
          config._retry = true;
          config._retryCount = (config._retryCount || 0) + 1;

          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, config._retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          return this.client(config);
        }

        if (error.response?.status === 401) {
          localStorage.removeItem("auth_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> =
      await this.client.post("/auth/login", credentials);
    return response.data.data;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    // Map frontend field names to backend field names
    const backendData = {
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
    };

    const response: AxiosResponse<ApiResponse<User>> = await this.client.post(
      "/auth",
      backendData
    );
    return response.data;
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(
      "/users/profile"
    );
    return response.data;
  }

  async getUsers(filters?: UserFilters): Promise<ApiResponse<User[]>> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get(
      "/users",
      {
        params: filters,
      }
    );
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(
      `/users/${id}`
    );
    return response.data;
  }

  async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.put(
      `/users/${id}`,
      userData
    );
    return response.data;
  }

  async deactivateUser(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(
      `/users/${id}`
    );
    return response.data;
  }

  async activateUser(id: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.post(
      `/users/${id}/activate`
    );
    return response.data;
  }

  async assignRole(userId: string, role: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.post(
      `/users/${userId}/roles`,
      { role }
    );
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    // Create user via auth endpoint
    const createData = {
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
    };

    const response: AxiosResponse<ApiResponse<User>> = await this.client.post(
      "/auth",
      createData
    );

    // If admin role is requested, assign it
    if (userData.role === "admin") {
      await this.assignRole(response.data.data.id, "admin");
      // Fetch updated user with roles
      return await this.getUserById(response.data.data.id);
    }

    return response.data;
  }

  // Order endpoints
  async getOrders(filters?: OrderFilters): Promise<ApiResponse<Order[]>> {
    const response: AxiosResponse<ApiResponse<Order[]>> = await this.client.get(
      "/orders",
      {
        params: filters,
      }
    );
    return response.data;
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const response: AxiosResponse<ApiResponse<Order>> = await this.client.get(
      `/orders/${id}`
    );
    return response.data;
  }

  async createOrder(
    orderData: CreateOrderRequest
  ): Promise<ApiResponse<Order>> {
    const response: AxiosResponse<ApiResponse<Order>> = await this.client.post(
      "/orders",
      orderData
    );
    return response.data;
  }

  async updateOrder(
    id: string,
    orderData: Partial<Order>
  ): Promise<ApiResponse<Order>> {
    const response: AxiosResponse<ApiResponse<Order>> = await this.client.put(
      `/orders/${id}`,
      orderData
    );
    return response.data;
  }

  async cancelOrder(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(
      `/orders/${id}`
    );
    return response.data;
  }

  // Vending Machine endpoints
  async getVendingMachines(
    includeInactive = false
  ): Promise<ApiResponse<VendingMachine[]>> {
    const response: AxiosResponse<ApiResponse<VendingMachine[]>> =
      await this.client.get("/vending-machines", {
        params: { includeInactive },
      });
    return response.data;
  }

  async getVendingMachineById(
    id: string
  ): Promise<ApiResponse<VendingMachine>> {
    const response: AxiosResponse<ApiResponse<VendingMachine>> =
      await this.client.get(`/vending-machines/${id}`);
    return response.data;
  }

  async createVendingMachine(
    machineData: Partial<VendingMachine>
  ): Promise<ApiResponse<VendingMachine>> {
    const response: AxiosResponse<ApiResponse<VendingMachine>> =
      await this.client.post("/vending-machines", machineData);
    return response.data;
  }

  async updateVendingMachine(
    id: string,
    machineData: Partial<VendingMachine>
  ): Promise<ApiResponse<VendingMachine>> {
    const response: AxiosResponse<ApiResponse<VendingMachine>> =
      await this.client.put(`/vending-machines/${id}`, machineData);
    return response.data;
  }

  async deleteVendingMachine(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(
      `/vending-machines/${id}`
    );
    return response.data;
  }

  async updateMachineStatus(
    id: string,
    status: string,
    telemetry?: Record<string, unknown>
  ): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.post(
      `/vending-machines/${id}/status`,
      {
        status,
        telemetry,
      }
    );
    return response.data;
  }

  async getMachineStatus(id: string): Promise<ApiResponse<unknown>> {
    const response: AxiosResponse<ApiResponse<unknown>> = await this.client.get(
      `/vending-machines/${id}/status`
    );
    return response.data;
  }

  // Payment endpoints
  async createPayment(
    paymentData: CreatePaymentRequest
  ): Promise<ApiResponse<Payment>> {
    const response: AxiosResponse<ApiResponse<Payment>> =
      await this.client.post("/payments", paymentData);
    return response.data;
  }

  async confirmPayment(id: string): Promise<ApiResponse<Payment>> {
    const response: AxiosResponse<ApiResponse<Payment>> =
      await this.client.post(`/payments/${id}/confirm`);
    return response.data;
  }

  async getPayments(): Promise<ApiResponse<Payment[]>> {
    const response: AxiosResponse<ApiResponse<Payment[]>> =
      await this.client.get("/payments");
    return response.data;
  }

  // Wallet endpoints
  async createWallet(): Promise<ApiResponse<Wallet>> {
    const response: AxiosResponse<ApiResponse<Wallet>> = await this.client.post(
      "/payments/wallet/create"
    );
    return response.data;
  }

  async getWalletBalance(): Promise<number> {
    const response: AxiosResponse<ApiResponse<{ balance: number }>> =
      await this.client.get("/payments/wallet/balance");
    return response.data.data.balance;
  }

  async topUpWallet(amount: number): Promise<ApiResponse<Wallet>> {
    const response: AxiosResponse<ApiResponse<Wallet>> = await this.client.post(
      "/payments/wallet/top-up",
      { amount }
    );
    return response.data;
  }

  // Admin endpoints
  async getAdminDashboard(): Promise<ApiResponse<DashboardData>> {
    const response: AxiosResponse<ApiResponse<DashboardData>> =
      await this.client.get("/admin/dashboard");
    return response.data;
  }

  async getMaintenanceRequired(): Promise<ApiResponse<VendingMachine[]>> {
    const response: AxiosResponse<ApiResponse<VendingMachine[]>> =
      await this.client.get("/admin/maintenance/required");
    return response.data;
  }

  // Client dashboard stats
  async getClientStats(userId: string): Promise<ApiResponse<ClientStats>> {
    try {
      // Get user statistics and orders in parallel
      const [statsResponse, ordersResponse] = await Promise.all([
        this.client.get(`/users/${userId}/statistics`),
        this.client.get('/orders', { params: { userId } })
      ]);

      const stats = statsResponse.data.data;
      const orders = ordersResponse.data.data || [];

      // Helper function to get latest status from statuses array
      const getLatestStatus = (order: Order): string => {
        if (order.statuses && order.statuses.length > 0) {
          return order.statuses[order.statuses.length - 1].status;
        }
        return 'unknown';
      };

      // Calculate order statistics
      const activeOrders = orders.filter((order: Order) =>
        ['pending', 'processing', 'printing'].includes(getLatestStatus(order))
      ).length;

      const completedOrders = orders.filter((order: Order) =>
        getLatestStatus(order) === 'completed'
      ).length;

      const totalSpent = orders.reduce((sum: number, order: Order) =>
        sum + (parseFloat(order.cost) || 0), 0
      );

      const clientStats: ClientStats = {
        totalOrders: stats.totalOrders || orders.length || 0,
        activeOrders,
        completedOrders,
        totalSpent,
      };

      return {
        success: true,
        data: clientStats,
        message: 'Client statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching client stats:', error);
      // Return default stats if API call fails
      return {
        success: false,
        data: {
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          totalSpent: 0,
        },
        message: 'Failed to fetch client statistics',
      };
    }
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.put(
      "/users/profile",
      userData
    );
    return response.data;
  }

  // Analytics endpoints
  async getOrderAnalytics(
    filters: AnalyticsFilters
  ): Promise<ApiResponse<OrderAnalytics>> {
    const response: AxiosResponse<ApiResponse<OrderAnalytics>> =
      await this.client.get("/analytics/orders", { params: filters });
    return response.data;
  }

  async getMachineAnalytics(
    filters: AnalyticsFilters
  ): Promise<ApiResponse<MachineAnalytics>> {
    const response: AxiosResponse<ApiResponse<MachineAnalytics>> =
      await this.client.get("/analytics/machines", { params: filters });
    return response.data;
  }

  async getRevenueAnalytics(
    filters: AnalyticsFilters
  ): Promise<ApiResponse<RevenueAnalytics>> {
    const response: AxiosResponse<ApiResponse<RevenueAnalytics>> =
      await this.client.get("/analytics/revenue", { params: filters });
    return response.data;
  }

  // Admin specific endpoints
  async updateOrderStatus(
    orderId: string,
    statusData: UpdateOrderStatusRequest
  ): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.post(
      `/orders/${orderId}/status`,
      statusData
    );
    return response.data;
  }

  async generateReport(
    reportData: GenerateReportRequest
  ): Promise<ApiResponse<Report>> {
    const response: AxiosResponse<ApiResponse<Report>> = await this.client.post(
      "/admin/reports/generate",
      reportData
    );
    return response.data;
  }

  async exportAnalyticsData(filters: AnalyticsFilters): Promise<Blob> {
    const response = await this.client.get("/analytics/export", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  }

  // Enhanced machine management
  async createMachine(
    machineData: CreateVendingMachineRequest
  ): Promise<ApiResponse<VendingMachine>> {
    const response: AxiosResponse<ApiResponse<VendingMachine>> =
      await this.client.post("/vending-machines", machineData);
    return response.data;
  }

  async updateMachine(
    id: string,
    machineData: UpdateVendingMachineRequest
  ): Promise<ApiResponse<VendingMachine>> {
    const response: AxiosResponse<ApiResponse<VendingMachine>> =
      await this.client.put(`/vending-machines/${id}`, machineData);
    return response.data;
  }

  async restoreMachine(id: string): Promise<ApiResponse<VendingMachine>> {
    const response: AxiosResponse<ApiResponse<VendingMachine>> =
      await this.client.post(`/vending-machines/${id}/restore`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
