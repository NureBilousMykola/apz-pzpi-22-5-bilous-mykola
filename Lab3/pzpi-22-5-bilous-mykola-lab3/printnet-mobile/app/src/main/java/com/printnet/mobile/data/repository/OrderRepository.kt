package com.printnet.mobile.data.repository

import com.printnet.mobile.data.api.ApiClient
import com.printnet.mobile.data.models.*
import retrofit2.Response

class OrderRepository {
    private val apiService = ApiClient.apiService
    
    suspend fun getOrders(
        status: String? = null,
        page: Int = 1,
        limit: Int = 20
    ): Response<ApiResponse<List<Order>>> {
        return apiService.getOrders(status, page, limit)
    }
    
    suspend fun getOrder(orderId: String): Response<ApiResponse<Order>> {
        return apiService.getOrder(orderId)
    }
    
    suspend fun cancelOrder(
        orderId: String,
        reason: String
    ): Response<ApiResponse<SuccessMessage>> {
        return apiService.cancelOrder(
            orderId,
            CancelOrderRequest(reason)
        )
    }
}