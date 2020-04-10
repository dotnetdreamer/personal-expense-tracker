import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../../shared/entity/base.entity';

@Entity()
export class ExternalAuth extends BaseEntity {
    @Column()
    userId: number;
    
    @Column()
    email: string;

    @Column()
    externalIdentifier: string;

    @Column({ nullable: true })
    oAuthAccessToken?: string;

    @Column()
    providerSystemName: string;
}
