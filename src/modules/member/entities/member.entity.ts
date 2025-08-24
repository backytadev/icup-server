import {
  Column,
  Entity,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MinistryMember } from '../../ministry/entities/ministry-member.entity';

@Entity({ name: 'members' })
export class Member {
  //* General and personal info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'first_names' })
  firstNames: string;

  @Column('text', { name: 'last_names' })
  lastNames: string;

  @Column('text', { name: 'gender' })
  gender: string;

  @Column('text', { name: 'origin_country' })
  originCountry: string;

  @Column('date', { name: 'birth_date' })
  birthDate: Date;

  @Column('int', { name: 'age' })
  age: number;

  @Column('text', { name: 'marital_status' })
  maritalStatus: string;

  @Column('int', { name: 'number_children', default: 0 })
  numberChildren: number;

  @Column('date', { name: 'conversion_date', nullable: true })
  conversionDate: Date | null;

  //* Contact Info

  @Column('text', { name: 'email', unique: true, nullable: true })
  email: string;

  @Column('text', { name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column('text', { name: 'residence_country', default: 'Perú' })
  residenceCountry: string;

  @Column('text', { name: 'residence_department', default: 'Lima' })
  residenceDepartment: string;

  @Column('text', { name: 'residence_province', default: 'Lima' })
  residenceProvince: string;

  @Column('text', { name: 'residence_district' })
  residenceDistrict: string;

  @Column('text', { name: 'residence_urban_sector' })
  residenceUrbanSector: string;

  @Column('text', { name: 'residence_address' })
  residenceAddress: string;

  @Column('text', { name: 'reference_address' })
  referenceAddress: string;

  @Column({ name: 'roles', type: 'text', array: true })
  roles: string[];

  //* Relations (Array)
  @OneToMany(() => MinistryMember, (ministryMember) => ministryMember.member)
  ministries: MinistryMember[];

  //? Internal Functions
  @BeforeInsert()
  @BeforeUpdate()
  transformToDates() {
    this.birthDate = new Date(this.birthDate);
    this.conversionDate = new Date(this.conversionDate);

    // Generate age with birth date
    const ageMiliSeconds = Date.now() - this.birthDate.getTime();

    const ageDate = new Date(ageMiliSeconds);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    this.age = age;
  }
}
