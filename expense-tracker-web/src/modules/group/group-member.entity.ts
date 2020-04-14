import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from 'src/modules/shared/entity/base.entity';
import { Group } from './group.entity';
import { User } from '../user/user.entity';

@Entity()
export class GroupMember extends BaseEntity {
    @ManyToOne(type => User)
    user: User;

    @ManyToOne(type => Group, grp => grp.members)
    group: Group;
}
