package com.printnet.mobile.utils

import android.util.Log

object DebugUtils {
    private const val TAG = "PrintNetApp"
    
    fun logError(message: String, throwable: Throwable? = null) {
        Log.e(TAG, message, throwable)
    }
    
    fun logInfo(message: String) {
        Log.i(TAG, message)
    }
    
    fun logDebug(message: String) {
        Log.d(TAG, message)
    }
    
    fun logApiResponse(endpoint: String, success: Boolean, message: String? = null) {
        val status = if (success) "SUCCESS" else "ERROR"
        Log.d(TAG, "API $endpoint: $status${message?.let { " - $it" } ?: ""}")
    }
    
    fun logUserAction(action: String, details: String? = null) {
        Log.d(TAG, "USER ACTION: $action${details?.let { " - $it" } ?: ""}")
    }
}