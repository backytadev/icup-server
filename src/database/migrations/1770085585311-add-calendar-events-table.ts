import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendarEventsTable1770085585311 implements MigrationInterface {
  name = 'AddCalendarEventsTable1770085585311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calendar_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "description" text NOT NULL, "date" date NOT NULL, "time" text NOT NULL, "location" text NOT NULL, "latitude" numeric(10,8), "longitude" numeric(11,8), "category" text NOT NULL DEFAULT 'worship_service', "imageUrl" text, "created_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, CONSTRAINT "PK_faf5391d232322a87cdd1c6f30c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD CONSTRAINT "FK_29b10e413d1a7ccd621915e2586" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD CONSTRAINT "FK_62accd3c9c49b869f746bc606b0" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_62accd3c9c49b869f746bc606b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_29b10e413d1a7ccd621915e2586"`,
    );
    await queryRunner.query(`DROP TABLE "calendar_events"`);
  }
}
