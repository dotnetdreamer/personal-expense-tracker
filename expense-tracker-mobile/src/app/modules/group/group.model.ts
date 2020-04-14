import { IUser } from '../authentication/authentication.model';

export interface IGroup {
    id?: number
    guid: string
    name: string
    entityName: string;
    members?: IGroupMember[];

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
    status: GroupMemberStatus
    user: IUser;
    group: IGroup;
}

export interface IGroupMemberAddOrUpdateResponse {
    groupNotFound: boolean;
    memberNotFound: boolean;
    notAnOwner: boolean;
    data: IGroup;
}

export enum GroupMemberStatus {
    Pending = 'pending',
    Aproved = 'aproved',
    Rejected = 'rejected'
}