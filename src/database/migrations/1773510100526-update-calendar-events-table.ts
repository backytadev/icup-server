import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCalendarEventsTable1773510100526 implements MigrationInterface {
  name = 'UpdateCalendarEventsTable1773510100526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calendar_events" DROP COLUMN "date"`);
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "imageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "location"`,
    );
    await queryRunner.query(`ALTER TABLE "calendar_events" DROP COLUMN "time"`);
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "start_date" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "end_date" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "location_name" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "location_reference" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "status" text NOT NULL DEFAULT 'draft'`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "targetGroups" text array NOT NULL DEFAULT '{general}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "is_public" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "image_urls" text array NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "church_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD CONSTRAINT "FK_f12f6796f2e882247e22d22eb14" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_f12f6796f2e882247e22d22eb14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "church_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "image_urls"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "is_public"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "targetGroups"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "location_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "location_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "end_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" DROP COLUMN "start_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "time" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "location" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "imageUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ADD "date" date NOT NULL`,
    );
  }
}
