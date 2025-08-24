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
import { Preacher } from '../../../modules/preacher/entities/preacher.entity';
import { Disciple } from '../../../modules/disciple/entities/disciple.entity';
import { Supervisor } from '../../../modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '../../../modules/family-group/entities/family-group.entity';

@Entity({ name: 'copastors' })
export class Copastor {
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

  //? Relations (Array)
  @OneToMany(() => Supervisor, (supervisor) => supervisor.theirCopastor)
  supervisors: Supervisor[];

  @OneToMany(() => Preacher, (preacher) => preacher.theirCopastor)
  preachers: Preacher[];

  @OneToMany(() => Zone, (zone) => zone.theirCopastor)
  zones: Zone[];

  @OneToMany(() => FamilyGroup, (familyGroup) => familyGroup.theirCopastor)
  familyGroups: FamilyGroup[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirCopastor)
  disciples: Disciple[];

  //? Relations(FK);
  @ManyToOne(() => Pastor, (pastor) => pastor.copastors)
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;

  @ManyToOne(() => Church, (church) => church.copastors)
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;
}
