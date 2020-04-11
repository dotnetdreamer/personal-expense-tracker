export interface IGroup {
    id?: number
    name: string
    entityName: string

    createdOn?: string
    updatedOn?: string

    createdBy?: number
    updatedBy?: number

    markedForAdd?: boolean
    markedForUpdate?: boolean
    markedForDelete?: boolean
}