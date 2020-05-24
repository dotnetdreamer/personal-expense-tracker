import { ICategoryParams } from "../category/category.model";
import { IAttachmentParams } from "../attachment/attachment.model";
import { IGroupParams } from "../group/group.model";

export interface IExpense {
    id?: number;
    category: number | ICategoryParams;
    group: number | IGroupParams;
    transactions?: IExpenseTransaction[];
    description: string;
    amount: string;
    notes?: string;
    attachment?: number | IAttachmentParams
    createdOn: string
    updatedOn?: string
    isDeleted: boolean
    markedForAdd: boolean
    markedForUpdate: boolean
    markedForDelete: boolean
}

export interface IExpenseTransaction {
    transactionType: TransactionType;
    debit: number;
    credit: number;
    email: string;
    name?: string;
    actualPaidAmount: number;
}

export enum TransactionType {
    PaidByYouAndSplitEqually = 10,
    YouOweFullAmount = 20,
    TheyOweFullAmount = 30,
    PaidByOtherPersonAndSplitEqually = 40,
    Mutiple = 50
}