import {
  Column,
  Unique,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '../../../../common/enums/record-status.enum';

import { Zone } from '../../../../modules/zone/entities/zone.entity';
import { User } from '../../../../modules/user/entities/user.entity';
import { Pastor } from '../../../../modules/pastor/entities/pastor.entity';
import { Church } from '../../../../modules/church/entities/church.entity';
import { Disciple } from '../../../../modules/disciple/entities/disciple.entity';
import { Copastor } from '../../../../modules/copastor/entities/copastor.entity';
import { Preacher } from '../../../../modules/preacher/entities/preacher.entity';
import { Supervisor } from '../../../../modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '../../../../modules/family-group/entities/family-group.entity';
import { ExternalDonor } from '../../../../modules/external-donor/entities/external-donor.entity';

@Entity({ name: 'offering_income' })
@Unique(['church', 'receiptCode'])
export class OfferingIncome {
  //* General data
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  type: string;

  @Column('text', { name: 'sub_type', nullable: true })
  subType: string;

  @Column('text', { name: 'category', nullable: true })
  category: string;

  @Column('decimal')
  amount: number;

  @Column('text')
  currency: string;

  @Column('text', { name: 'comments', nullable: true })
  comments: string;

  @Column('date', { name: 'date' })
  date: Date;

  @Column('text', { name: 'image_urls', array: true })
  imageUrls: string[];

  @Column('text', { name: 'shift', nullable: true })
  shift: string;

  @Column('text', { name: 'receipt_code' })
  receiptCode: string;

  @Column('text', { name: 'inactivation_reason', nullable: true })
  inactivationReason: string;

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

  @Column('text', {
    name: 'record_status',
    default: RecordStatus.Active,
  })
  recordStatus: string;

  @Column('text', { name: 'member_type', nullable: true })
  memberType: string;

  //* Relations (FK)
  //? Church
  @ManyToOne(() => Church, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'church_id' })
  church: Church;

  //? Family Group
  @ManyToOne(() => FamilyGroup, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'family_group_id' })
  familyGroup: FamilyGroup;

  //? Member
  @ManyToOne(() => Pastor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pastor_id' })
  pastor: Pastor;

  @ManyToOne(() => Copastor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'copastor_id' })
  copastor: Copastor;

  @ManyToOne(() => Supervisor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Supervisor;

  @ManyToOne(() => Preacher, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'preacher_id' })
  preacher: Preacher;

  @ManyToOne(() => Disciple, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'disciple_id' })
  disciple: Disciple;

  //? Donor
  @ManyToOne(() => ExternalDonor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'external_donor_id' })
  externalDonor: ExternalDonor;

  //? Zone
  @ManyToOne(() => Zone, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;
}
