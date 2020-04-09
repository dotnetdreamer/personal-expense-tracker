import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../../base.entity';

@Entity()
export class AccessToken extends BaseEntity {
    @Column()
    userId: number;
    
  @Column()
  accessToken: string;

  @Column()
  refreshToken: string;

  @Column()
  accessTokenExpiresOn: Date;

  @Column()
  refreshTokenExpiresOn: Date;

  @Column()
  createdOn?: Date

  @Column({ nullable: true })
  updatedOn?: Date
}
