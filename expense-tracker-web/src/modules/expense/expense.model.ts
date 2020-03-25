import { ICategoryParams } from "../category/category.model";
import { IAttachmentParams } from "../attachment/attachment.model";

export interface IExpenseParams {
    id?: number
    category: number | ICategoryParams
    description: string
    amount: string
    notes?: string
    attachment?: number | IAttachmentParams
    createdOn: string
    updatedOn?: string
    isDeleted: boolean
    markedForAdd: boolean
    markedForUpdate: boolean
    markedForDelete: boolean
}