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
import { Church } from '../../../modules/church/entities/church.entity';
import { Member } from '../../../modules/member/entities/member.entity';
import { Copastor } from '../../../modules/copastor/entities/copastor.entity';
import { Preacher } from '../../../modules/preacher/entities/preacher.entity';
import { Disciple } from '../../../modules/disciple/entities/disciple.entity';
import { Ministry } from '../../../modules/ministry/entities/ministry.entity';
import { Supervisor } from '../../../modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '../../../modules/family-group/entities/family-group.entity';

@Entity({ name: 'pastors' })
export class Pastor {
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

  //? Relations (Array)
  @OneToMany(() => Ministry, (ministry) => ministry.theirPastor)
  ministries: Ministry[];

  @OneToMany(() => Copastor, (copastor) => copastor.theirPastor)
  copastors: Copastor[];

  @OneToMany(() => Supervisor, (supervisor) => supervisor.theirPastor)
  supervisors: Supervisor[];

  @OneToMany(() => Preacher, (preacher) => preacher.theirPastor)
  preachers: Preacher[];

  @OneToMany(() => Zone, (zone) => zone.theirPastor)
  zones: Zone[];

  @OneToMany(() => FamilyGroup, (familyGroup) => familyGroup.theirPastor)
  familyGroups: FamilyGroup[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirPastor)
  disciples: Disciple[];

  //? Relations(FK);
  @ManyToOne(() => Church, (church) => church.pastors)
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;
}
