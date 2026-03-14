import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../../modules/user/entities/user.entity';
import { Church } from '../../../modules/church/entities/church.entity';
import { CalendarEventCategory } from '../../../common/enums/calendar-event-category.enum';
import { CalendarEventStatus } from '../../../common/enums/calendar-event-status.enum';
import { CalendarEventTargetGroup } from '../../../common/enums/calendar-event-target-group.enum';

@Entity({ name: 'calendar_events' })
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //* General info
  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('timestamptz', { name: 'start_date' })
  startDate: Date;

  @Column('timestamptz', { name: 'end_date', nullable: true })
  endDate: Date;

  @Column('text', { name: 'location_name', nullable: true })
  locationName: string;

  @Column('text', { name: 'location_reference', nullable: true })
  locationReference: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column('text', { default: CalendarEventCategory.WorshipService })
  category: string;

  @Column('text', { default: CalendarEventStatus.Draft })
  status: string;

  @Column('text', {
    array: true,
    default: `{${CalendarEventTargetGroup.General}}`,
  })
  targetGroups: string[];

  @Column('boolean', { name: 'is_public', default: true })
  isPublic: boolean;

  @Column('text', { name: 'image_urls', array: true })
  imageUrls: string[];

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

  //* Relations (FK)
  @ManyToOne(() => Church, { eager: true, nullable: true })
  @JoinColumn({ name: 'church_id' })
  church: Church;
}
