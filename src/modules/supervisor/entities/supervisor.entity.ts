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

import { Zone } from '../../../modules/zone/entities/zone.entity';
import { User } from '../../../modules/user/entities/user.entity';
import { Pastor } from '../../../modules/pastor/entities/pastor.entity';
import { Member } from '../../../modules/member/entities/member.entity';
import { Church } from '../../../modules/church/entities/church.entity';
import { Copastor } from '../../../modules/copastor/entities/copastor.entity';
import { Disciple } from '../../../modules/disciple/entities/disciple.entity';
import { Preacher } from '../../../modules/preacher/entities/preacher.entity';
import { FamilyGroup } from '../../../modules/family-group/entities/family-group.entity';

@Entity({ name: 'supervisors' })
export class Supervisor {
  //* General and Personal info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //* Relations with member
  @OneToOne(() => Member, {})
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column('boolean', {
    name: 'is_direct_relation_to_pastor',
    default: false,
  })
  isDirectRelationToPastor: boolean;

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
  @OneToMany(() => Preacher, (preacher) => preacher.theirSupervisor)
  preachers: Preacher[];

  @OneToMany(() => FamilyGroup, (familyGroup) => familyGroup.theirSupervisor)
  familyGroups: FamilyGroup[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirSupervisor)
  disciples: Disciple[];

  //* Relations (FK)
  @ManyToOne(() => Church, (church) => church.supervisors)
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;

  @ManyToOne(() => Pastor, (pastor) => pastor.supervisors)
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.supervisors, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_copastor_id' })
  theirCopastor: Copastor;

  @OneToOne(() => Zone, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_zone_id' })
  theirZone: Zone;
}
