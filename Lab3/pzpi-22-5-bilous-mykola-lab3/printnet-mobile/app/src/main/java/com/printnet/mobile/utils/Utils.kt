package com.printnet.mobile.utils

import android.util.Patterns
import java.text.SimpleDateFormat
import java.util.*

object DateUtils {
    
    private val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    
    // Alternative format without milliseconds
    private val inputFormatNoMillis = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault()).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    
    private val displayFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
    private val shortDisplayFormat = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault())
    
    fun formatDate(dateString: String): String {
        return try {
            // Try with milliseconds first
            val date = try {
                inputFormat.parse(dateString)
            } catch (e: Exception) {
                // Try without milliseconds
                inputFormatNoMillis.parse(dateString)
            } ?: Date()
            displayFormat.format(date)
        } catch (e: Exception) {
            // Fallback - return original string if parsing fails
            dateString
        }
    }
    
    fun formatDateShort(dateString: String): String {
        return try {
            // Try with milliseconds first
            val date = try {
                inputFormat.parse(dateString)
            } catch (e: Exception) {
                // Try without milliseconds
                inputFormatNoMillis.parse(dateString)
            } ?: Date()
            shortDisplayFormat.format(date)
        } catch (e: Exception) {
            // Fallback - return original string if parsing fails
            dateString
        }
    }
}

object ValidationUtils {
    
    fun isValidEmail(email: String): Boolean {
        return Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
    
    fun isValidPassword(password: String): Boolean {
        return password.length >= 6
    }
}