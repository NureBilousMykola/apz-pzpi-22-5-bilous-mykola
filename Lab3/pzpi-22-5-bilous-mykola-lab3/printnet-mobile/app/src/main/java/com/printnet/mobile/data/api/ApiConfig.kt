package com.printnet.mobile.data.api

object ApiConfig {
    // For Android Emulator - use 10.0.2.2 which maps to localhost
    private const val EMULATOR_BASE_URL = "http://10.0.2.2:3000/"
    
    // For Physical Device - replace with your computer's IP address
    // To find your IP: Windows -> ipconfig, Mac/Linux -> ifconfig
    private const val DEVICE_BASE_URL = "http://192.168.1.100:3000/" // CHANGE THIS
    
    // Set this to true when testing on a physical device
    private const val USE_PHYSICAL_DEVICE = false
    
    val BASE_URL = if (USE_PHYSICAL_DEVICE) DEVICE_BASE_URL else EMULATOR_BASE_URL
}