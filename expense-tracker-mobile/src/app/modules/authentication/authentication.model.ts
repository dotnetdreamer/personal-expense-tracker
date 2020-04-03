export interface IUser {
    uuid
    name: string
    email: string
    photo: string
    mobile?: string
}

export interface IUserProfile extends IUser {
    photoStyle?: string
}

export enum LoginType {
    STANDARD = 'standard',
    GOOGLE = 'google',
    APPLE = 'apple'
}

export interface ILoginParams {
    email? 
    password? 
    loginType: LoginType
    user: IUser
}