import { IUser } from '../authentication/user.model';

export interface IGroup {
    id?: number
    guid: string
    name: string
    entityName: string;
    members?: IGroupMember[];
    periods?: IGroupPeriod[]

    createdOn?: string
    updatedOn?: string

    createdBy?: number
    updatedBy?: number

    markedForAdd?: boolean
    markedForUpdate?: boolean
    markedForDelete?: boolean
}

export interface IGroupMember {
    id: number;
    status: GroupMemberStatus;
    user: IUser;
    group: IGroup;
}

export interface IGroupPeriod {
    id: number;
    startDate: string;
    endDate: string;
    status: GroupPeriodStatus;
}

export interface IGroupMemberAddOrUpdateResponse {
    groupNotFound: boolean;
    memberNotFound: boolean;
    notAnOwner: boolean;
    alreadyMember: boolean;
    data: IGroupMember;
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