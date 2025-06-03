package com.printnet.mobile.utils

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.printnet.mobile.ui.viewmodels.AuthViewModel

@Composable
fun AuthStateHandler(
    authViewModel: AuthViewModel,
    onAuthStateChanged: (Boolean) -> Unit
) {
    val authUiState by authViewModel.uiState.collectAsStateWithLifecycle()
    
    LaunchedEffect(authUiState.isLoggedIn) {
        onAuthStateChanged(authUiState.isLoggedIn)
    }
}