import { ICategory } from '../category/category.model';
import { IAttachment } from '../attachment/attachment.model';
import { IGroup } from '../group/group.model';

export interface IExpense {
    id?: number;
    category?: ICategory;
    group?: IGroup;
    transactions?: IExpenseTransaction[];
    description: string;
    amount: string;
    notes?: string;
    attachment?: IAttachment;
    createdOn?: string;
    updatedOn?: string;
    createdBy?: string;
    createdByName?: string;
    updatedBy?: string;
    updatedByName?: string;
    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}

export interface IExpenseTransaction {
    transactionType: TransactionType;
    debit: number;
    credit: number;
    actualPaidAmount: number;
    email: string;
    name?: string;
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
