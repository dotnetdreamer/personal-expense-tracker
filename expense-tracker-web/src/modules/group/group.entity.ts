import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

import { BaseUserEntity } from '../shared/entity/base-user.entity';
import { GroupMember } from './group-member.entity';

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

}
