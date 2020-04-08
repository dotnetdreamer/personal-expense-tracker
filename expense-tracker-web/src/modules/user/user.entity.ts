import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../base.entity';

@Entity()
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  photo?: string
  
  @Column({ nullable: true })
  mobile?: string;

  @Column()
  isDeleted: boolean

  @Column()
  createdOn: Date

  @Column({ nullable: true })
  updatedOn?: Date
}
