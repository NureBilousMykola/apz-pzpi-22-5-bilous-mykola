package com.printnet.mobile.data.models

import com.google.gson.annotations.SerializedName

data class Order(
    val id: String,
    val user: User,
    val machine: VendingMachine?,
    @SerializedName("model_file_url")
    val modelFileUrl: String,
    @SerializedName("print_settings")
    val printSettings: Map<String, Any>,
    val cost: Double,
    @SerializedName("created_at")
    val createdAt: String,
    @SerializedName("updated_at")
    val updatedAt: String,
    val statuses: List<OrderStatus>
)

data class VendingMachine(
    val id: String,
    val name: String,
    val location: String?
)

data class OrderStatus(
    val id: String,
    val status: String,
    val description: String?,
    @SerializedName("created_at")
    val createdAt: String
)

data class CancelOrderRequest(
    val reason: String
)