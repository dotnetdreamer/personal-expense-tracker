import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseComplexEntity } from '../shared/entity/base-complex.entity';

@Entity()
export class Attachment extends BaseComplexEntity {
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
}