export enum MediaFileType {
    Picture = 0,
    Video = 1,
    Audio = 2,
    Document = 3
}

export interface IMediaFile {
    serverUrl: string
    files: IMediaOption[]
}

export interface IMediaOption {
    fileData: any
    mediaType: MediaOptionType
}

export enum MediaOptionType {
    Base64String = 'base64String',
    LocalFileSystem = 'localFileSystem',
    FormData = 'formData'
}

export enum MediaReturnFileType {
    DATA_URL = 0,
    FILE_URI_OR_NATIVE_URI = 1
}