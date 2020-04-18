import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from 'src/modules/shared/entity/base.entity';
import { User } from '../user/user.entity';
import { Expense } from './expense.entity';
import { TransactionType } from './expense.model';

@Entity()
export class ExpenseTransaction extends BaseEntity {
    @ManyToOne(type => User)
    user: User;

    @ManyToOne(type => Expense, exp => exp.transactions)
    expense: Expense;

    @Column()
    transactionType: TransactionType;

    @Column()
    debit: number;

    @Column()
    credit: number;

    @Column()
    actualPaidAmount: number;
}
