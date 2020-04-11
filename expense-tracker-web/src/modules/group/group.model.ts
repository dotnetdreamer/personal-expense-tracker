export interface IGroupParams {
    id?: number
    name: string
    entityName: string
    createdOn: string
    updatedOn?: string
    isDeleted: boolean
    
    markedForAdd: boolean
    markedForUpdate: boolean
    markedForDelete: boolean

    createdBy?: number
    updatedBy?: number
}