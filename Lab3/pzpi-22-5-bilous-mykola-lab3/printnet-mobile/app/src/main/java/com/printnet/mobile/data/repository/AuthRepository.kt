package com.printnet.mobile.data.repository

import com.printnet.mobile.data.api.ApiClient
import com.printnet.mobile.data.models.*
import retrofit2.Response

class AuthRepository {
    private val apiService = ApiClient.apiService
    
    suspend fun login(email: String, password: String): Response<ApiResponse<LoginData>> {
        return apiService.login(LoginRequest(email, password))
    }
    
    suspend fun register(
        email: String,
        password: String,
        firstName: String,
        lastName: String
    ): Response<ApiResponse<User>> {
        return apiService.register(
            RegisterRequest(email, password, firstName, lastName)
        )
    }
}

class UserRepository {
    private val apiService = ApiClient.apiService
    
    suspend fun getProfile(): Response<ApiResponse<User>> {
        return apiService.getProfile()
    }
    
    suspend fun updateUser(
        userId: String,
        firstName: String?,
        lastName: String?,
        email: String?
    ): Response<ApiResponse<User>> {
        return apiService.updateUser(
            userId,
            UpdateUserRequest(firstName, lastName, email)
        )
    }
    
    suspend fun changePassword(
        oldPassword: String,
        newPassword: String
    ): Response<ApiResponse<SuccessMessage>> {
        return apiService.changePassword(
            ChangePasswordRequest(oldPassword, newPassword)
        )
    }
}