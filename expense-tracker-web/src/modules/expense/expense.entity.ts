import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';

import { BaseUserEntity } from '../shared/entity/base-user.entity';
import { ExpenseTransaction } from './expense.transaction.entity';
import { Group } from '../group/group.entity';
import { Category } from '../category/category.entity';

@Entity()
export class Expense extends BaseUserEntity {
  @Column()
  description: string;
  
  @Column()
  amount: number

  @ManyToOne(type => Category, cat => cat.id)
  category: Category;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  attachmentId: number;

  @ManyToOne(type => Group, { nullable: true })
  group?: Group;

  //important to cascade as we wanna save transactions togather with expense on save call
  @OneToMany(type => ExpenseTransaction, exp => exp.expense, { nullable: true, cascade: ['insert', 'update'] })
  transactions?: ExpenseTransaction[];
}
