import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../base.entity';

@Entity()
export class Expense extends BaseEntity {
  @Column()
  description: string;
  
  @Column()
  amount: number

  @Column()
  categoryId: number

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  attachment: Buffer;

  @Column()
  isDeleted: boolean

  @Column()
  createdOn: Date

  @Column({ nullable: true })
  updatedOn?: Date
}
