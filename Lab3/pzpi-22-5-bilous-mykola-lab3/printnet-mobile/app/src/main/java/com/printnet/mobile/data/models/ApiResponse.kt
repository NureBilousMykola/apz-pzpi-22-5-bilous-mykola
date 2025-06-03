package com.printnet.mobile.data.models

import com.google.gson.annotations.SerializedName

// Generic API Response wrapper
data class ApiResponse<T>(
    val data: T,
    val success: Boolean,
    val message: String?,
    val timestamp: String
)

// For endpoints that return simple success messages
data class SuccessMessage(
    val message: String
)