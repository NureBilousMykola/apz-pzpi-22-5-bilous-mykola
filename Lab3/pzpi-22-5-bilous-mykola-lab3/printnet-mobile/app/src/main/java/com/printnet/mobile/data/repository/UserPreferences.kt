package com.printnet.mobile.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class UserPreferences(private val context: Context) {
    
    companion object {
        private val Context.dataStore: DataStore<Preferences> by preferencesDataStore("user_preferences")
        private val AUTH_TOKEN_KEY = stringPreferencesKey("auth_token")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
        private val USER_FIRST_NAME_KEY = stringPreferencesKey("user_first_name")
        private val USER_LAST_NAME_KEY = stringPreferencesKey("user_last_name")
    }
    
    val authToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[AUTH_TOKEN_KEY]
    }
    
    val userId: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_ID_KEY]
    }
    
    val userEmail: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_EMAIL_KEY]
    }
    
    val userFirstName: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_FIRST_NAME_KEY]
    }
    
    val userLastName: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_LAST_NAME_KEY]
    }
    
    suspend fun saveUserSession(
        token: String,
        userId: String,
        email: String,
        firstName: String?,
        lastName: String?
    ) {
        context.dataStore.edit { preferences ->
            preferences[AUTH_TOKEN_KEY] = token
            preferences[USER_ID_KEY] = userId
            preferences[USER_EMAIL_KEY] = email
            firstName?.let { preferences[USER_FIRST_NAME_KEY] = it }
            lastName?.let { preferences[USER_LAST_NAME_KEY] = it }
        }
    }
    
    suspend fun updateUserInfo(
        userId: String,
        email: String,
        firstName: String?,
        lastName: String?
    ) {
        context.dataStore.edit { preferences ->
            preferences[USER_ID_KEY] = userId
            preferences[USER_EMAIL_KEY] = email
            firstName?.let { preferences[USER_FIRST_NAME_KEY] = it }
            lastName?.let { preferences[USER_LAST_NAME_KEY] = it }
        }
    }
    
    suspend fun clearUserSession() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}