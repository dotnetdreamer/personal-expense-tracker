import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../base.entity';

@Entity()
export class Category extends BaseEntity {
  @Column()
  name: string;
  
  @Column()
  groupName: string

  @Column({ nullable: true })
  icon?: string

  @Column()
  isDeleted: boolean

  @Column()
  createdOn: string

  @Column({ nullable: true })
  updatedOn: string
}