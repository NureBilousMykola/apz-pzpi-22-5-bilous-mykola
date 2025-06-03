package com.printnet.mobile.utils

import retrofit2.Response

object ErrorHandler {
    
    fun <T> handleApiError(response: Response<T>): String {
        return when (response.code()) {
            400 -> "Bad request. Please check your input."
            401 -> "Authentication failed. Please login again."
            403 -> "Access denied. You don't have permission for this action."
            404 -> "Resource not found."
            409 -> "Conflict. The resource already exists or is in use."
            422 -> "Invalid data provided."
            429 -> "Too many requests. Please try again later."
            500 -> "Server error. Please try again later."
            502, 503 -> "Service temporarily unavailable. Please try again later."
            else -> "An error occurred. Please try again."
        }
    }
    
    fun handleNetworkError(exception: Throwable): String {
        return when {
            exception.message?.contains("Unable to resolve host") == true -> 
                "No internet connection. Please check your connection."
            exception.message?.contains("timeout") == true -> 
                "Request timed out. Please try again."
            exception.message?.contains("SSL") == true -> 
                "Security error. Please check your connection."
            exception.message?.contains("Connection refused") == true -> 
                "Unable to connect to server. Please try again later."
            else -> exception.message ?: "Network error occurred"
        }
    }
    
    fun isNetworkError(exception: Throwable): Boolean {
        val message = exception.message?.lowercase() ?: ""
        return message.contains("network") || 
               message.contains("connection") || 
               message.contains("timeout") || 
               message.contains("host") ||
               message.contains("ssl")
    }
}