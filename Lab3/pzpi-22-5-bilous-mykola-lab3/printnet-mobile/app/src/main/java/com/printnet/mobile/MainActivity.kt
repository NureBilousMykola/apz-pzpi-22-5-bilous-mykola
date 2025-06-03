package com.printnet.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import com.printnet.mobile.navigation.PrintNetApp
import com.printnet.mobile.ui.theme.PrintnetMobileTheme
import com.printnet.mobile.ui.viewmodels.AuthViewModel
import com.printnet.mobile.ui.viewmodels.OrdersViewModel
import com.printnet.mobile.ui.viewmodels.ProfileViewModel
import com.printnet.mobile.ui.viewmodels.ViewModelFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PrintnetMobileTheme {
                val viewModelFactory = ViewModelFactory(this@MainActivity)
                
                val authViewModel: AuthViewModel = viewModel(factory = viewModelFactory)
                val profileViewModel: ProfileViewModel = viewModel(factory = viewModelFactory)
                val ordersViewModel: OrdersViewModel = viewModel(factory = viewModelFactory)
                
                PrintNetApp(
                    authViewModel = authViewModel,
                    profileViewModel = profileViewModel,
                    ordersViewModel = ordersViewModel
                )
            }
        }
    }
}