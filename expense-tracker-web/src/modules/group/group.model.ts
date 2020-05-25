export interface IGroupParams {
    id?: number
    name: string
    guid: string
    entityName: string
    periods?: any[]

    createdOn: string
    updatedOn?: string
    isDeleted: boolean
    
    markedForAdd: boolean
    markedForUpdate: boolean
    markedForDelete: boolean

    createdBy?: number
    updatedBy?: number
}

export interface IGroupMemberParams {
    id?: number;
    email: string;
    groupId: number;
    status?: GroupMemberStatus
}

export enum GroupMemberStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected'
}

export enum GroupPeriodStatus {
    Open = 'open',
    Closed = 'closed'
}