import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

import { BaseUserEntity } from '../shared/entity/base-user.entity';
import { ExpenseTransaction } from './expense.transaction.entity';

@Entity()
export class Expense extends BaseUserEntity {
  @Column()
  description: string;
  
  @Column()
  amount: number

  @Column()
  categoryId: number

  @Column({ nullable: true })
  groupId?: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  attachmentId: number;

  @OneToMany(type => ExpenseTransaction, exp => exp.expense, { nullable: true })
  transactions?: ExpenseTransaction[];
}
