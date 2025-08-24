import {
  Column,
  Entity,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '../../../common/enums/record-status.enum';

import { User } from '../../../modules/user/entities/user.entity';
import { Zone } from '../../../modules/zone/entities/zone.entity';
import { Church } from '../../../modules/church/entities/church.entity';
import { Pastor } from '../../../modules/pastor/entities/pastor.entity';
import { Member } from '../../../modules/member/entities/member.entity';
import { Copastor } from '../../../modules/copastor/entities/copastor.entity';
import { Disciple } from '../../../modules/disciple/entities/disciple.entity';
import { Supervisor } from '../../../modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '../../../modules/family-group/entities/family-group.entity';

@Entity({ name: 'preachers' })
export class Preacher {
  //* General and Personal info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //* Relations with member
  @OneToOne(() => Member, {})
  @JoinColumn({ name: 'member_id' })
  member: Member;

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

  @Column('text', {
    name: 'relation_type',
    nullable: true,
  })
  relationType: string;

  //* Relations (Array)
  @OneToMany(() => Disciple, (disciple) => disciple.theirPreacher)
  disciples: Disciple[];

  //* Relations(FK)
  @ManyToOne(() => Church, (church) => church.preachers)
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;

  @ManyToOne(() => Pastor, (pastor) => pastor.preachers)
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.preachers, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_copastor_id' })
  theirCopastor: Copastor;

  @ManyToOne(() => Supervisor, (supervisor) => supervisor.preachers, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_supervisor_id' })
  theirSupervisor: Supervisor;

  @ManyToOne(() => Zone, (zone) => zone.preachers)
  @JoinColumn({ name: 'their_zone_id' })
  theirZone: Zone;

  @OneToOne(() => FamilyGroup, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_family_group_id' })
  theirFamilyGroup: FamilyGroup;
}
