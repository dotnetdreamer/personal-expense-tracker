import { ICategory } from '../category/category.model';

export interface IExpense {
    id?: number
    categoryId: number
    category?: ICategory
    description: string
    amount: string
    notes?: string
    attachment?
    createdOn?: string
    updatedOn?: string
    markedForAdd?: boolean
    markedForUpdate?: boolean
    markedForDelete?: boolean
}