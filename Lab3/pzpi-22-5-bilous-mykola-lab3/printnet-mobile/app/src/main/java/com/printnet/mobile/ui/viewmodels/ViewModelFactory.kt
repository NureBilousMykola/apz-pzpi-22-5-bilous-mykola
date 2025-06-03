package com.printnet.mobile.ui.viewmodels

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.printnet.mobile.data.repository.AuthRepository
import com.printnet.mobile.data.repository.OrderRepository
import com.printnet.mobile.data.repository.UserPreferences
import com.printnet.mobile.data.repository.UserRepository

class ViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        val userPreferences = UserPreferences(context)
        
        return when (modelClass) {
            AuthViewModel::class.java -> {
                AuthViewModel(
                    authRepository = AuthRepository(),
                    userPreferences = userPreferences
                ) as T
            }
            ProfileViewModel::class.java -> {
                ProfileViewModel(
                    userRepository = UserRepository(),
                    userPreferences = userPreferences
                ) as T
            }
            OrdersViewModel::class.java -> {
                OrdersViewModel(
                    orderRepository = OrderRepository()
                ) as T
            }
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}