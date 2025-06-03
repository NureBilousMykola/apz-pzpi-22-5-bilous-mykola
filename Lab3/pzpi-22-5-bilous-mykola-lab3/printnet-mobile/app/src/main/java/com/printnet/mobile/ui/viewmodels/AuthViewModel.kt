package com.printnet.mobile.ui.viewmodels

import android.util.Log.e
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.printnet.mobile.data.api.ApiClient
import com.printnet.mobile.data.repository.AuthRepository
import com.printnet.mobile.data.repository.UserPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.printnet.mobile.utils.DebugUtils

data class AuthUiState(
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val errorMessage: String? = null,
    val isLoginMode: Boolean = true
)

class AuthViewModel(
    private val authRepository: AuthRepository,
    private val userPreferences: UserPreferences
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()
    
    init {
        checkLoginStatus()
    }
    
    private fun checkLoginStatus() {
        viewModelScope.launch {
            try {
                DebugUtils.logDebug("Checking stored login status")
                
                userPreferences.authToken.collect { token ->
                    if (!token.isNullOrEmpty()) {
                        DebugUtils.logDebug("Found stored auth token, setting logged in state")
                        ApiClient.setAuthToken(token)
                        _uiState.value = _uiState.value.copy(isLoggedIn = true)
                    } else {
                        DebugUtils.logDebug("No stored auth token found")
                    }
                }
            } catch (e: Exception) {
                DebugUtils.logError("Error checking login status", e)
                // Don't crash the app if there's an issue with stored preferences
            }
        }
    }
    
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            try {
                val response = authRepository.login(email, password)
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success) {
                        val loginData = apiResponse.data
                        
                        // Save user session
                        userPreferences.saveUserSession(
                            token = loginData.accessToken,
                            userId = loginData.user.id,
                            email = loginData.user.email,
                            firstName = loginData.user.firstName,
                            lastName = loginData.user.lastName
                        )
                        
                        // Set auth token for API client
                        ApiClient.setAuthToken(loginData.accessToken)
                        
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isLoggedIn = true,
                            errorMessage = null
                        )
                        
                        DebugUtils.logUserAction("Login Success", "User successfully logged in")
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = apiResponse.message ?: "Login failed"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Invalid credentials"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Login failed"
                )
            }
        }
    }    
    fun register(email: String, password: String, firstName: String, lastName: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            try {
                val response = authRepository.register(email, password, firstName, lastName)
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success) {
                        // After successful registration, login the user
                        login(email, password)
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = apiResponse.message ?: "Registration failed"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Registration failed"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Registration failed"
                )
            }
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            try {
                DebugUtils.logUserAction("Logout", "User initiated logout")
                
                // Clear user session from preferences
                userPreferences.clearUserSession()
                
                // Clear auth token from API client
                ApiClient.setAuthToken(null)
                
                // Update UI state
                _uiState.value = _uiState.value.copy(
                    isLoggedIn = false,
                    errorMessage = null,
                    isLoading = false
                )
                
                DebugUtils.logUserAction("Logout Success", "User successfully logged out")
                
            } catch (e: Exception) {
                DebugUtils.logError("Logout error, attempting fallback", e)
                
                // Even if there's an error, we still want to log out
                // Just clear the state without throwing
                try {
                    ApiClient.setAuthToken(null)
                    _uiState.value = _uiState.value.copy(
                        isLoggedIn = false,
                        errorMessage = null,
                        isLoading = false
                    )
                    
                    DebugUtils.logUserAction("Logout Fallback", "Logout completed via fallback")
                    
                } catch (ignored: Exception) {
                    DebugUtils.logError("Logout fallback failed, using last resort", ignored)
                    
                    // Last resort - just update the logged in state
                    _uiState.value = AuthUiState(isLoggedIn = false)
                }
            }
        }
    }
    
    fun toggleAuthMode() {
        _uiState.value = _uiState.value.copy(
            isLoginMode = !_uiState.value.isLoginMode,
            errorMessage = null
        )
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}