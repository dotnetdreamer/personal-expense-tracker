import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseUserEntity } from '../shared/entity/base-user.entity';

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
}
