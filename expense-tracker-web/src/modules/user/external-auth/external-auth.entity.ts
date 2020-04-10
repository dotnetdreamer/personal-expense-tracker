import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../../base.entity';

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

    @Column()
    createdOn?: Date

    @Column({ nullable: true })
    updatedOn?: Date
}
