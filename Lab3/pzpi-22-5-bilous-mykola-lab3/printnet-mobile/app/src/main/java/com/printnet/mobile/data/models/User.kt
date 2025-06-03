package com.printnet.mobile.data.models

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val email: String,
    @SerializedName("first_name")
    val firstName: String?,
    @SerializedName("last_name")
    val lastName: String?,
    val phone: String?,
    @SerializedName("is_active")
    val isActive: Boolean,
    @SerializedName("created_at")
    val createdAt: String,
    @SerializedName("updated_at")
    val updatedAt: String,
    val roles: List<UserRole>
)

data class UserRole(
    val id: String,
    val role: String,
    @SerializedName("created_at")
    val createdAt: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginData(
    @SerializedName("access_token")
    val accessToken: String,
    val user: User
)

data class RegisterRequest(
    val email: String,
    val password: String,
    @SerializedName("first_name")
    val firstName: String,
    @SerializedName("last_name")
    val lastName: String
)

data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

data class UpdateUserRequest(
    @SerializedName("first_name")
    val firstName: String?,
    @SerializedName("last_name")
    val lastName: String?,
    val email: String?
)