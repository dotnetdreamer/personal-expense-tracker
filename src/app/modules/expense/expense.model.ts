export interface IExpense {
    id: number
    categoryId: number
    title: string
    amount: string
    description?: string
    createdOn?: string
}