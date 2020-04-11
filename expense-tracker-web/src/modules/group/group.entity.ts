import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseUserEntity } from '../shared/entity/base-user.entity';

@Entity()
export class Group extends BaseUserEntity {
  @Column()
  name: string;
  
  @Column()
  entityName: string
}
