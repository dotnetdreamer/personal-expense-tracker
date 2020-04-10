export interface IRegistrationParams {
    email: string
    name: string
    mobile: string
    password: string
    externalAuth?: any
}


export interface ILoginParams {
    email: string
    password: string
}