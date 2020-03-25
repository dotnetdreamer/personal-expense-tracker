import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../base.entity';

@Entity()
export class Attachment extends BaseEntity {
  @Column()
  filename: string;
  
  @Column()
  extension: string

  @Column()
  contentType: string

  @Column()
  guid: string

  // @Column()
  // attachment: blob

  @Column()
  isDeleted: boolean

  @Column()
  createdOn: Date

  @Column({ nullable: true })
  updatedOn?: Date
}