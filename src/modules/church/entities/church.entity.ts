import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '../../../common/enums/record-status.enum';

import { Zone } from '../../../modules/zone/entities/zone.entity';
import { User } from '../../../modules/user/entities/user.entity';
import { Pastor } from '../../../modules/pastor/entities/pastor.entity';
import { Copastor } from '../../../modules/copastor/entities/copastor.entity';
import { Preacher } from '../../../modules/preacher/entities/preacher.entity';
import { Ministry } from '../../../modules/ministry/entities/ministry.entity';
import { Disciple } from '../../../modules/disciple/entities/disciple.entity';
import { Supervisor } from '../../../modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '../../../modules/family-group/entities/family-group.entity';

@Entity({ name: 'churches' })
export class Church {
  //* General info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'church_name', unique: true })
  churchName: string;

  @Column('text', {
    name: 'abbreviated_church_name',
    unique: true,
  })
  abbreviatedChurchName: string;

  @Column('text', { name: 'church_code', unique: true, nullable: true })
  churchCode: string;

  @Column('boolean', { name: 'is_anexe', default: false })
  isAnexe: boolean;

  @Column('text', { name: 'service_times', array: true })
  serviceTimes: string[];

  @Column('date', { name: 'founding_date' })
  foundingDate: Date;

  //* Contact Info

  @Column('text', { name: 'email', unique: true })
  email: string;

  @Column('text', { name: 'phone_number' })
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
  @OneToMany(() => Church, (church) => church.theirMainChurch)
  anexes: Church[];

  @OneToMany(() => Pastor, (pastor) => pastor.theirChurch)
  pastors: Pastor[];

  @OneToMany(() => Ministry, (ministry) => ministry.theirChurch)
  ministries: Ministry[];

  @OneToMany(() => Copastor, (copastor) => copastor.theirChurch)
  copastors: Copastor[];

  @OneToMany(() => Supervisor, (supervisor) => supervisor.theirChurch)
  supervisors: Supervisor[];

  @OneToMany(() => Preacher, (preacher) => preacher.theirChurch)
  preachers: Preacher[];

  @OneToMany(() => Zone, (zone) => zone.theirChurch)
  zones: Zone[];

  @OneToMany(() => FamilyGroup, (familyGroup) => familyGroup.theirChurch)
  familyGroups: FamilyGroup[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirChurch)
  disciples: Disciple[];

  @ManyToMany(() => User, (user) => user.churches)
  users: User[];

  //* Relations(FK)
  @ManyToOne(() => Church, (church) => church.anexes, {
    nullable: true,
  })
  @JoinColumn({ name: 'their_main_church_id' })
  theirMainChurch: Church;
}
