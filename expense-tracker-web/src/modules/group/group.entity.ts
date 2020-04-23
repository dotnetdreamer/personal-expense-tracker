import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

import { BaseUserEntity } from '../shared/entity/base-user.entity';
import { GroupMember } from './group-member.entity';
import { GroupPeriod } from './group-period.entity';

@Entity()
export class Group extends BaseUserEntity {
  @Column()
  name: string;

  @Column()
  guid: string; 
  
  @Column()
  entityName: string;

  @OneToMany(type => GroupMember, mbr => mbr.group)
  members: GroupMember[];

  //important to cascade as we wanna save periods togather with group on save call
  @OneToMany(type => GroupPeriod, pr => pr.group, { cascade: ['insert', 'update'] })
  periods: GroupPeriod[];

}
