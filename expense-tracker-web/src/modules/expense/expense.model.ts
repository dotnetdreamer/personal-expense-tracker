export interface IExpenseParams {
    id?: number
    categoryId: number
    description: string
    amount: string
    notes?: string
    attachment?
    createdOn: string
    updatedOn?: string
    isDeleted: boolean
    markedForAdd: boolean
    markedForUpdate: boolean
    markedForDelete: boolean
}