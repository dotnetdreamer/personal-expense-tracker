import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseComplexEntity } from '../shared/entity/base-complex.entity';
import { UserRole, UserStatus } from './user.model';

@Entity()
export class User extends BaseComplexEntity {
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
  role: UserRole; 

  @Column()
  status: UserStatus; 
}
