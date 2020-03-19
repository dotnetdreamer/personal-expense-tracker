import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

//   @Column()
//   lastName: string;

//   @Column({ default: true })
//   isActive: boolean;
}