import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

import { BaseEntity } from '../../modules/shared/entity/base.entity';

@Entity()
export class EmailAccount extends BaseEntity {
    @Column()
    email: string;

    @Column()
    displayName: string;

    @Column()
    host: string;

    @Column()
    port: number;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column()
    enableSsl: boolean;

    @Column()
    useDefaultCredentials: boolean;
}