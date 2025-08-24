import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ministry } from './ministry.entity';
import { User } from '../../user/entities/user.entity';
import { Member } from '../../member/entities/member.entity';

@Entity()
export class MinistryMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'member_roles',
    type: 'text',
    array: true,
  })
  memberRoles: string[];

  @Column({
    name: 'ministry_roles',
    type: 'text',
    array: true,
  })
  ministryRoles: string[];

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

  //* Relations
  @ManyToOne(() => Member, (member) => member.ministries)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Ministry, (ministry) => ministry.members)
  @JoinColumn({ name: 'ministry_id' })
  ministry: Ministry;
}
