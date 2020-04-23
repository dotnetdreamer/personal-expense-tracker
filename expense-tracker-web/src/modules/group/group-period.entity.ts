import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from 'src/modules/shared/entity/base.entity';
import { Group } from './group.entity';
import { GroupPeriodStatus } from './group.model';

@Entity()
export class GroupPeriod extends BaseEntity {
    @ManyToOne(type => Group, grp => grp.members)
    group: Group;

    @Column()
    startDate: Date;

    @Column({ nullable: true })
    endDate?: Date;

    @Column()
    status: GroupPeriodStatus;
}
