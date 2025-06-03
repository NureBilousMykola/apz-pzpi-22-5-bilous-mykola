package com.printnet.mobile.data.api

import com.printnet.mobile.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Auth endpoints
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginData>>
    
    @POST("auth")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<User>>
    
    // User endpoints
    @GET("users/profile")
    suspend fun getProfile(): Response<ApiResponse<User>>
    
    @PUT("users/{id}")
    suspend fun updateUser(
        @Path("id") userId: String,
        @Body request: UpdateUserRequest
    ): Response<ApiResponse<User>>
    
    @POST("users/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<ApiResponse<SuccessMessage>>
    
    // Orders endpoints
    @GET("orders")
    suspend fun getOrders(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<Order>>>
    
    @GET("orders/{id}")
    suspend fun getOrder(@Path("id") orderId: String): Response<ApiResponse<Order>>
    
    @POST("orders/{id}/cancel")
    suspend fun cancelOrder(
        @Path("id") orderId: String,
        @Body request: CancelOrderRequest
    ): Response<ApiResponse<SuccessMessage>>
}