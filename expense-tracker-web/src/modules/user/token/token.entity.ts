import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../../shared/entity/base.entity';

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
}
