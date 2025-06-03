package com.printnet.mobile.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.printnet.mobile.ui.viewmodels.ProfileViewModel
import com.printnet.mobile.ui.viewmodels.AuthViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    profileViewModel: ProfileViewModel,
    authViewModel: AuthViewModel,
    onLogout: () -> Unit
) {
    val uiState by profileViewModel.uiState.collectAsStateWithLifecycle()
    
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    
    // Initialize form fields when user data is loaded
    LaunchedEffect(uiState.user) {
        uiState.user?.let { user ->
            firstName = user.firstName ?: ""
            lastName = user.lastName ?: ""
            email = user.email
        }
    }
    
    // Reset form fields when editing is cancelled
    LaunchedEffect(uiState.isEditing) {
        if (!uiState.isEditing) {
            uiState.user?.let { user ->
                firstName = user.firstName ?: ""
                lastName = user.lastName ?: ""
                email = user.email
            }
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header with title and actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Profile",
                style = MaterialTheme.typography.headlineMedium
            )
            
            Row {
                // Refresh button
                IconButton(onClick = {
                    profileViewModel.loadProfile()
                }) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh"
                    )
                }
                
                // Logout button
                IconButton(onClick = {
                    try {
                        authViewModel.logout()
                        // Navigation will be handled automatically by auth state change in PrintNetApp
                    } catch (e: Exception) {
                        // Handle logout error gracefully
                        authViewModel.logout() // Try again
                    }
                }) {
                    Icon(
                        imageVector = Icons.Default.ExitToApp,
                        contentDescription = "Logout"
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Loading profile...")
                    }
                }
            }
            
            uiState.errorMessage != null && uiState.user == null -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = uiState.errorMessage!!,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Button(onClick = { profileViewModel.loadProfile() }) {
                        Text("Retry")
                    }
                }
            }
            
            uiState.user != null -> {
                ProfileContent(
                    firstName = firstName,
                    lastName = lastName,
                    email = email,
                    onFirstNameChange = { firstName = it },
                    onLastNameChange = { lastName = it },
                    onEmailChange = { email = it },
                    uiState = uiState,
                    onSave = { profileViewModel.updateProfile(firstName, lastName, email) },
                    onStartEdit = { profileViewModel.startEditing() },
                    onCancelEdit = { profileViewModel.cancelEditing() }
                )
            }
        }
    }
}

@Composable
private fun ProfileContent(
    firstName: String,
    lastName: String,
    email: String,
    onFirstNameChange: (String) -> Unit,
    onLastNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    uiState: com.printnet.mobile.ui.viewmodels.ProfileUiState,
    onSave: () -> Unit,
    onStartEdit: () -> Unit,
    onCancelEdit: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // User ID (read-only)
            OutlinedTextField(
                value = uiState.user?.id?.take(8) ?: "",
                onValueChange = { },
                label = { Text("User ID") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                enabled = false,
                singleLine = true
            )
            
            // First Name
            OutlinedTextField(
                value = firstName,
                onValueChange = onFirstNameChange,
                label = { Text("First Name") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                enabled = uiState.isEditing,
                singleLine = true,
                isError = uiState.isEditing && firstName.isBlank()
            )
            
            // Last Name
            OutlinedTextField(
                value = lastName,
                onValueChange = onLastNameChange,
                label = { Text("Last Name") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                enabled = uiState.isEditing,
                singleLine = true,
                isError = uiState.isEditing && lastName.isBlank()
            )
            
            // Email
            OutlinedTextField(
                value = email,
                onValueChange = onEmailChange,
                label = { Text("Email") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                enabled = uiState.isEditing,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                isError = uiState.isEditing && !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
            )
            
            // Account Status
            OutlinedTextField(
                value = if (uiState.user?.isActive == true) "Active" else "Inactive",
                onValueChange = { },
                label = { Text("Account Status") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                enabled = false,
                singleLine = true
            )
            
            // Error message
            uiState.errorMessage?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }
            
            // Success message
            if (uiState.updateSuccess) {
                Text(
                    text = "Profile updated successfully!",
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }
            
            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (uiState.isEditing) {
                    Button(
                        onClick = onSave,
                        modifier = Modifier.weight(1f),
                        enabled = !uiState.isLoading && 
                                firstName.isNotBlank() && 
                                lastName.isNotBlank() && 
                                android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Save")
                        }
                    }
                    
                    OutlinedButton(
                        onClick = onCancelEdit,
                        modifier = Modifier.weight(1f),
                        enabled = !uiState.isLoading
                    ) {
                        Text("Cancel")
                    }
                } else {
                    Button(
                        onClick = onStartEdit,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Edit Profile")
                    }
                }
            }
        }
    }
}