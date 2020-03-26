export interface ICategory {
    name: string
    groupName: string
    icon: string
    id?: number
    createdOn?: string
    updatedOn?: string
    markedForAdd?: boolean
    markedForUpdate?: boolean
    markedForDelete?: boolean
}