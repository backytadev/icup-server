import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '../../../common/enums/record-status.enum';

import { MinistryMember } from './ministry-member.entity';
import { User } from '../../../modules/user/entities/user.entity';
import { Church } from '../../../modules/church/entities/church.entity';
import { Pastor } from '../../../modules/pastor/entities/pastor.entity';

@Entity({ name: 'ministries' })
export class Ministry {
  //* General info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'ministry_type' })
  ministryType: string;

  @Column('text', {
    name: 'custom_ministry_name',
    unique: true,
  })
  customMinistryName: string;

  @Column('text', { name: 'ministry_code', unique: true, nullable: true })
  ministryCode: string;

  @Column('text', { name: 'service_times', array: true })
  serviceTimes: string[];

  @Column('date', { name: 'founding_date' })
  foundingDate: Date;

  //* Contact Info
  @Column('text', { name: 'email', unique: true, nullable: true })
  email: string;

  @Column('text', { name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column('text', { name: 'country', default: 'Perú' })
  country: string;

  @Column('text', { name: 'department', default: 'Lima' })
  department: string;

  @Column('text', { name: 'province', default: 'Lima' })
  province: string;

  @Column('text', { name: 'district' })
  district: string;

  @Column('text', { name: 'urban_sector' })
  urbanSector: string;

  @Column('text', { name: 'address' })
  address: string;

  @Column('text', { name: 'reference_address' })
  referenceAddress: string;

  //* Info register and update date
  @Column('timestamptz', { name: 'created_at', nullable: true })
  createdAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
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

  //* Relations (Array)
  @OneToMany(() => MinistryMember, (ministryMember) => ministryMember.ministry)
  members: MinistryMember[];

  //* Relations(FK)
  @ManyToOne(() => Church, (church) => church.ministries)
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;

  @ManyToOne(() => Pastor, (pastor) => pastor.ministries)
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;
}
