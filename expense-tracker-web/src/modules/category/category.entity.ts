import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseComplexEntity } from '../shared/entity/base-complex.entity';

@Entity()
export class Category extends BaseComplexEntity {
  @Column()
  name: string;
  
  @Column()
  groupName: string

  @Column({ nullable: true })
  icon: string
}