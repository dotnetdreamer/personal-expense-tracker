export interface IUser {
    uuid
    name: string
    email: string
    photo: string
    mobile?: string
    externalAuthResponse?: IGoogleAuthResponse | any
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

export interface IGoogleAuthResponse {
    email: string
    familyName: string
    givenName: string
    id: string
    imageUrl: string
    name: string
    authentication: { accessToken: string, idToken: string }
    serverAuthCode: string
}