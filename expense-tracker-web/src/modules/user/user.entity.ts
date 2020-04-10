import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseComplexEntity } from '../shared/entity/base-complex.entity';

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
}
