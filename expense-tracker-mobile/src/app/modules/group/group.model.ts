export interface IGroup {
    id?: number
    name: string
    entityName: string
    createdOn?: string
    updatedOn?: string
    markedForAdd?: boolean
    markedForUpdate?: boolean
    markedForDelete?: boolean
}