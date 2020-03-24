import { ICategory } from '../category/category.model';
import { IAttachment } from '../attachment/attachment.model';

export interface IExpense {
    id?: number
    categoryId: number
    category?: ICategory
    description: string
    amount: string
    notes?: string
    attachment?: IAttachment
    createdOn?: string
    updatedOn?: string
    markedForAdd?: boolean
    markedForUpdate?: boolean
    markedForDelete?: boolean
}