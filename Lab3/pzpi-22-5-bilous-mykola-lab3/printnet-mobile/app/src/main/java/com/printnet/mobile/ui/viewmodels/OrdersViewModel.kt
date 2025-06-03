package com.printnet.mobile.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.printnet.mobile.data.models.Order
import com.printnet.mobile.data.repository.OrderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class OrdersUiState(
    val isLoading: Boolean = false,
    val orders: List<Order> = emptyList(),
    val errorMessage: String? = null,
    val selectedOrder: Order? = null,
    val isOrderDetailLoading: Boolean = false
)

class OrdersViewModel(
    private val orderRepository: OrderRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(OrdersUiState())
    val uiState: StateFlow<OrdersUiState> = _uiState.asStateFlow()
    
    init {
        loadOrders()
    }
    
    fun loadOrders() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            try {
                val response = orderRepository.getOrders()
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success && apiResponse.data != null) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            orders = apiResponse.data,
                            errorMessage = null
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = apiResponse.message ?: "Failed to load orders"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Failed to load orders"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Failed to load orders"
                )
            }
        }
    }    
    fun loadOrderDetails(orderId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isOrderDetailLoading = true)
            
            try {
                val response = orderRepository.getOrder(orderId)
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success && apiResponse.data != null) {
                        _uiState.value = _uiState.value.copy(
                            isOrderDetailLoading = false,
                            selectedOrder = apiResponse.data,
                            errorMessage = null
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isOrderDetailLoading = false,
                            errorMessage = apiResponse.message ?: "Failed to load order details"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isOrderDetailLoading = false,
                        errorMessage = "Failed to load order details"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isOrderDetailLoading = false,
                    errorMessage = e.message ?: "Failed to load order details"
                )
            }
        }
    }
    
    fun cancelOrder(orderId: String, reason: String) {
        viewModelScope.launch {
            try {
                val response = orderRepository.cancelOrder(orderId, reason)
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success) {
                        // Reload orders to get updated status
                        loadOrders()
                        // Reload order details if this order is currently selected
                        if (_uiState.value.selectedOrder?.id == orderId) {
                            loadOrderDetails(orderId)
                        }
                    } else {
                        _uiState.value = _uiState.value.copy(
                            errorMessage = apiResponse.message ?: "Failed to cancel order"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        errorMessage = "Failed to cancel order"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = e.message ?: "Failed to cancel order"
                )
            }
        }
    }
    
    fun clearSelectedOrder() {
        _uiState.value = _uiState.value.copy(selectedOrder = null)
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}