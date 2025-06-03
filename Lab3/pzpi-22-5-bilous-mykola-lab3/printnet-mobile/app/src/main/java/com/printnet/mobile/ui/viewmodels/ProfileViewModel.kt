package com.printnet.mobile.ui.viewmodels

import android.util.Patterns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.printnet.mobile.data.models.User
import com.printnet.mobile.data.repository.UserRepository
import com.printnet.mobile.data.repository.UserPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import com.printnet.mobile.utils.ErrorHandler
import com.printnet.mobile.utils.DebugUtils

data class ProfileUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val errorMessage: String? = null,
    val isEditing: Boolean = false,
    val updateSuccess: Boolean = false,
    val retryCount: Int = 0
)

class ProfileViewModel(
    private val userRepository: UserRepository,
    private val userPreferences: UserPreferences
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()
    
    init {
        loadProfile()
    }
    
    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true, 
                errorMessage = null,
                updateSuccess = false
            )
            
            try {
                DebugUtils.logUserAction("Load Profile", "Fetching user profile data")
                val response = userRepository.getProfile()
                
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success && apiResponse.data != null) {
                        DebugUtils.logApiResponse("GET /users/profile", true)
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            user = apiResponse.data,
                            errorMessage = null,
                            retryCount = 0
                        )
                    } else {
                        DebugUtils.logApiResponse("GET /users/profile", false, apiResponse.message)
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = apiResponse.message ?: "Failed to load profile"
                        )
                    }
                } else {
                    val errorMessage = ErrorHandler.handleApiError(response)
                    DebugUtils.logApiResponse("GET /users/profile", false, errorMessage)
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errorMessage
                    )
                }
            } catch (e: Exception) {
                val errorMessage = ErrorHandler.handleNetworkError(e)
                DebugUtils.logError("Profile load failed", e)
                
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = errorMessage,
                    retryCount = _uiState.value.retryCount + 1
                )
            }
        }
    }    
    fun updateProfile(firstName: String, lastName: String, email: String) {
        viewModelScope.launch {
            val currentUser = _uiState.value.user ?: return@launch
            
            // Validate input
            if (firstName.trim().isBlank() || lastName.trim().isBlank()) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "First name and last name cannot be empty"
                )
                return@launch
            }
            
            if (!Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Please enter a valid email address"
                )
                return@launch
            }
            
            _uiState.value = _uiState.value.copy(
                isLoading = true, 
                errorMessage = null,
                updateSuccess = false
            )
            
            try {
                val response = userRepository.updateUser(
                    currentUser.id,
                    firstName.trim(),
                    lastName.trim(),
                    email.trim()
                )
                
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success && apiResponse.data != null) {
                        // Update user preferences with new data
                        userPreferences.updateUserInfo(
                            userId = apiResponse.data.id,
                            email = apiResponse.data.email,
                            firstName = apiResponse.data.firstName,
                            lastName = apiResponse.data.lastName
                        )
                        
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            user = apiResponse.data,
                            isEditing = false,
                            updateSuccess = true,
                            errorMessage = null
                        )
                        
                        // Clear success message after 3 seconds
                        delay(3000)
                        _uiState.value = _uiState.value.copy(updateSuccess = false)
                        
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = apiResponse.message ?: "Failed to update profile"
                        )
                    }
                } else {
                    val errorMessage = when (response.code()) {
                        400 -> "Invalid profile data provided"
                        401 -> "Authentication failed. Please login again."
                        403 -> "You don't have permission to update this profile"
                        409 -> "Email address is already in use"
                        else -> "Failed to update profile"
                    }
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errorMessage
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Failed to update profile"
                )
            }
        }
    }
    
    fun startEditing() {
        _uiState.value = _uiState.value.copy(
            isEditing = true, 
            updateSuccess = false,
            errorMessage = null
        )
    }
    
    fun cancelEditing() {
        _uiState.value = _uiState.value.copy(
            isEditing = false, 
            errorMessage = null,
            updateSuccess = false
        )
    }
    
    fun clearMessages() {
        _uiState.value = _uiState.value.copy(
            errorMessage = null, 
            updateSuccess = false
        )
    }
    
    fun retryLoadProfile() {
        if (_uiState.value.retryCount < 3) {
            loadProfile()
        } else {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Maximum retry attempts reached. Please check your connection and try again."
            )
        }
    }
}