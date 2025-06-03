package com.printnet.mobile.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.printnet.mobile.ui.screens.*
import com.printnet.mobile.ui.viewmodels.*

sealed class Screen(val route: String, val title: String) {
    object Login : Screen("login", "Login")
    object Profile : Screen("profile", "Profile")
    object Orders : Screen("orders", "Orders")
    object OrderDetail : Screen("order_detail/{orderId}", "Order Details") {
        fun createRoute(orderId: String) = "order_detail/$orderId"
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrintNetApp(
    authViewModel: AuthViewModel,
    profileViewModel: ProfileViewModel,
    ordersViewModel: OrdersViewModel
) {
    val authUiState by authViewModel.uiState.collectAsStateWithLifecycle()
    
    // Handle auth state changes automatically
    if (authUiState.isLoggedIn) {
        // User is logged in - show main app with navigation
        val navController = rememberNavController()
        
        Scaffold(
            bottomBar = {
                NavigationBar {
                    val navBackStackEntry by navController.currentBackStackEntryAsState()
                    val currentDestination = navBackStackEntry?.destination
                    
                    val bottomNavItems = listOf(
                        Screen.Orders to Icons.Default.Receipt,
                        Screen.Profile to Icons.Default.Person
                    )
                    
                    bottomNavItems.forEach { (screen, icon) ->
                        NavigationBarItem(
                            icon = { Icon(icon, contentDescription = null) },
                            label = { Text(screen.title) },
                            selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = Screen.Orders.route,
                modifier = Modifier.padding(innerPadding)
            ) {
                composable(Screen.Orders.route) {
                    OrdersScreen(
                        ordersViewModel = ordersViewModel,
                        onOrderClick = { orderId ->
                            navController.navigate(Screen.OrderDetail.createRoute(orderId))
                        }
                    )
                }
                
                composable(Screen.Profile.route) {
                    ProfileScreen(
                        profileViewModel = profileViewModel,
                        authViewModel = authViewModel,
                        onLogout = {
                            // Don't navigate here - let the auth state change handle it
                            // The PrintNetApp will automatically show LoginScreen when isLoggedIn becomes false
                        }
                    )
                }
                
                composable(Screen.OrderDetail.route) { backStackEntry ->
                    val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
                    OrderDetailScreen(
                        orderId = orderId,
                        ordersViewModel = ordersViewModel,
                        onBackClick = { navController.popBackStack() }
                    )
                }
            }
        }
    } else {
        LoginScreen(
            authViewModel = authViewModel,
            onLoginSuccess = {
                // Navigation will be handled automatically by auth state change
                // when isLoggedIn becomes true, the scaffold with tabs will be shown
            }
        )
    }
}