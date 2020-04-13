import { ICategory } from '../category/category.model';
import { IAttachment } from '../attachment/attachment.model';
import { IGroup } from '../group/group.model';

export interface IExpense {
    id?: number
    category?: ICategory
    group?: IGroup
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

export interface IExpenseTransaction {
    expenseId: number
    paidByUserEmail: string
    transactionType: TransactionType
    debit?: number
    credit?: number
}

export interface IExpenseDashboardReport {
    categories: Array<{ label, total, totalAmount }>;
    dates: Array<{ label, total, totalAmount }>;
}

export enum TransactionType {
    PaidByYouAndSplitEqually = 10,
    YouOweFullAmount = 20,
    TheyOweFullAmount = 30,
    PaidByOtherPersonAndSplitEqually = 40,
    Mutiple = 50
}
