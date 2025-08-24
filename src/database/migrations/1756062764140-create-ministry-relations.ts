import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMinistryRelations1756062764140
  implements MigrationInterface
{
  name = 'CreateMinistryRelations1756062764140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ministries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ministry_type" text NOT NULL, "custom_ministry_name" text NOT NULL, "ministry_code" text, "service_times" text array NOT NULL, "founding_date" date NOT NULL, "email" text, "phone_number" text, "country" text NOT NULL DEFAULT 'Perú', "department" text NOT NULL DEFAULT 'Lima', "province" text NOT NULL DEFAULT 'Lima', "district" text NOT NULL, "urban_sector" text NOT NULL, "address" text NOT NULL, "reference_address" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE, "inactivation_category" text, "inactivation_reason" text, "record_status" text NOT NULL DEFAULT 'active', "created_by" uuid, "updated_by" uuid, "their_church_id" uuid, "their_pastor_id" uuid, CONSTRAINT "UQ_05c1721f1bf62cbd57ac89ca36c" UNIQUE ("custom_ministry_name"), CONSTRAINT "UQ_56e643d4ddca1630db410aef88f" UNIQUE ("ministry_code"), CONSTRAINT "UQ_74ccea270a9cb6641ce8f89aefb" UNIQUE ("email"), CONSTRAINT "PK_ad897fa0432df1de62b552a8706" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ministry_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "member_roles" text array NOT NULL, "ministry_roles" text array NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "member_id" uuid, "ministry_id" uuid, CONSTRAINT "PK_da1eb85793f8eb7620c0d75c638" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisors" ADD "relation_type" text`,
    );
    await queryRunner.query(`ALTER TABLE "disciples" ADD "relation_type" text`);
    await queryRunner.query(`ALTER TABLE "preachers" ADD "relation_type" text`);
    await queryRunner.query(`ALTER TABLE "copastors" ADD "relation_type" text`);
    await queryRunner.query(`ALTER TABLE "pastors" ADD "relation_type" text`);
    await queryRunner.query(
      `ALTER TABLE "members" ALTER COLUMN "conversion_date" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministries" ADD CONSTRAINT "FK_20e0a0b059d88f1405ff73a6d4d" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministries" ADD CONSTRAINT "FK_79ec29e1d78d4043fa8b6d24772" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministries" ADD CONSTRAINT "FK_9bc51e5fb5dcde385d01024b266" FOREIGN KEY ("their_church_id") REFERENCES "churches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministries" ADD CONSTRAINT "FK_6d719e5f24fcd8d805bfd206fd0" FOREIGN KEY ("their_pastor_id") REFERENCES "pastors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministry_member" ADD CONSTRAINT "FK_86e94a7eb3e21b2dbef04f565b7" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministry_member" ADD CONSTRAINT "FK_b0ea168189d2974a348c9ced768" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministry_member" ADD CONSTRAINT "FK_67418cb760ab4765a81690a056c" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministry_member" ADD CONSTRAINT "FK_e15a7ccd6c9a2b2e00e6111a8be" FOREIGN KEY ("ministry_id") REFERENCES "ministries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ministry_member" DROP CONSTRAINT "FK_e15a7ccd6c9a2b2e00e6111a8be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministry_member" DROP CONSTRAINT "FK_67418cb760ab4765a81690a056c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministry_member" DROP CONSTRAINT "FK_b0ea168189d2974a348c9ced768"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministry_member" DROP CONSTRAINT "FK_86e94a7eb3e21b2dbef04f565b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministries" DROP CONSTRAINT "FK_6d719e5f24fcd8d805bfd206fd0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministries" DROP CONSTRAINT "FK_9bc51e5fb5dcde385d01024b266"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministries" DROP CONSTRAINT "FK_79ec29e1d78d4043fa8b6d24772"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministries" DROP CONSTRAINT "FK_20e0a0b059d88f1405ff73a6d4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "members" ALTER COLUMN "conversion_date" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pastors" DROP COLUMN "relation_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "copastors" DROP COLUMN "relation_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preachers" DROP COLUMN "relation_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disciples" DROP COLUMN "relation_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisors" DROP COLUMN "relation_type"`,
    );
    await queryRunner.query(`DROP TABLE "ministry_member"`);
    await queryRunner.query(`DROP TABLE "ministries"`);
  }
}
