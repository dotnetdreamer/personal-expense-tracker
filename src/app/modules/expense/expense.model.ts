export interface IExpense {
    id?: number
    categoryId: number
    description: string
    amount: string
    notes?: string
    createdOn: string
}