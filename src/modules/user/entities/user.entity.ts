import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
  BeforeInsert,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { RecordStatus } from '../../../common/enums/record-status.enum';
import { Church } from '../../../modules/church/entities/church.entity';

@Entity({ name: 'users' })
export class User {
  //* General info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'first_names' })
  firstNames: string;

  @Column('text', { name: 'last_names' })
  lastNames: string;

  @Column('text')
  gender: string;

  @Column('text', { name: 'user_name', unique: true, nullable: true })
  userName: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text', { select: false })
  password: string;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  //* Info register and update date
  @Column('timestamptz', { name: 'created_at', nullable: true })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column('text', { name: 'inactivation_category', nullable: true })
  inactivationCategory: string;

  @Column('text', { name: 'inactivation_reason', nullable: true })
  inactivationReason: string;

  @Column('text', {
    name: 'record_status',
    default: RecordStatus.Active,
  })
  recordStatus: string;

  //* Relations
  @ManyToMany(() => Church, (church) => church.users)
  @JoinTable({
    name: 'user_churches',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'church_id' },
  })
  churches: Church[];

  //? Internal Functions
  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }
}
