export interface IRegistrationParams {
    email: string
    name: string
    mobile: string
    password: string
    externalAuth?: any
}

export interface IUserUpdateParams {
    email?: string
    name?: string
    mobile?: string
    status?: UserStatus,
    role?: UserRole
}

export interface ILoginParams {
    email: string
    password: string
}

export enum UserRole {
    Admin = "admin",
    User = "user"
}

export enum UserStatus {
    Approved = "approved",
    Pending = "pending",
    Rejected = "rejected",
    Blocked = "blocked"
}