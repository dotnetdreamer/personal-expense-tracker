
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';

import { BaseEntity } from '../shared/entity/base.entity';
import { EmailAccount } from './email-account';
import { QueuedEmailPriority } from './system.model';

@Entity()
export class QueuedMessage extends BaseEntity {
    @Column()
    from: string;

    @Column()
    fromName: string;

    @Column()
    to: string;

    @Column()
    toName: string;

    @Column()
    replyTo: string;

    @Column()
    replyToName: string;

    @Column()
    subject: string;

    @Column()
    body: string;

    @Column()
    sentTries: number;

    @Column({ nullable: true })
    sentOnUtc?: Date;

    @ManyToOne(type => EmailAccount, ec => ec.id)
    emailAccount: EmailAccount;

    @Column()
    priority: QueuedEmailPriority;
}