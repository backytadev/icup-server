import {
  Column,
  Entity,
  OneToOne,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '../../../common/enums/record-status.enum';

import { Zone } from '../../../modules/zone/entities/zone.entity';
import { User } from '../../../modules/user/entities/user.entity';
import { Member } from '../../../modules/member/entities/member.entity';
import { Pastor } from '../../../modules/pastor/entities/pastor.entity';
import { Church } from '../../../modules/church/entities/church.entity';
import { Preacher } from '../../../modules/preacher/entities/preacher.entity';
import { Copastor } from '../../../modules/copastor/entities/copastor.entity';
import { Supervisor } from '../../../modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '../../../modules/family-group/entities/family-group.entity';

@Entity({ name: 'disciples' })
export class Disciple {
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

  @Column('text', {
    name: 'relation_type',
    nullable: true,
  })
  relationType: string;

  //* Relations (FK)
  @ManyToOne(() => Church, (church) => church.disciples)
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;

  @ManyToOne(() => Pastor, (pastor) => pastor.disciples)
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.disciples, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_copastor_id' })
  theirCopastor: Copastor;

  @ManyToOne(() => Supervisor, (supervisor) => supervisor.disciples, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_supervisor_id' })
  theirSupervisor: Supervisor;

  @ManyToOne(() => Zone, (zone) => zone.disciples)
  @JoinColumn({ name: 'their_zone_id' })
  theirZone: Zone;

  @ManyToOne(() => Preacher, (preacher) => preacher.disciples, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_preacher_id' })
  theirPreacher: Preacher;

  @ManyToOne(() => FamilyGroup, (familyGroup) => familyGroup.disciples)
  @JoinColumn({ name: 'their_family_group_id' })
  theirFamilyGroup: FamilyGroup;
}
