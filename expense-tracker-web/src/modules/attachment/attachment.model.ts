export interface IAttachmentParams {
    id: number
    guid: string
    contentType: string
    filename: string
    extension: string
    attachment: any
    createdOn?: string
    updatedOn?: string
    markedForAdd?: boolean
    markedForUpdate?: boolean
    markedForDelete?: boolean
}