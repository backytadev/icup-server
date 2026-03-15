import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCalendarEventDesciption1773524957694 implements MigrationInterface {
  name = 'UpdateCalendarEventDesciption1773524957694';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ALTER COLUMN "description" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ALTER COLUMN "image_urls" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ALTER COLUMN "image_urls" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_events" ALTER COLUMN "description" SET NOT NULL`,
    );
  }
}
