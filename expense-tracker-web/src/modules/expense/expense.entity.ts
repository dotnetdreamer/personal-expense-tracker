import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseComplexEntity } from '../shared/entity/base-complex.entity';

@Entity()
export class Expense extends BaseComplexEntity {
  @Column()
  description: string;
  
  @Column()
  amount: number

  @Column()
  categoryId: number

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  attachmentId: number;
}
