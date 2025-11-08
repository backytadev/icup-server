import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserChurchesPivotTable1762613574522
  implements MigrationInterface
{
  name = 'CreateUserChurchesPivotTable1762613574522';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_churches" ("user_id" uuid NOT NULL, "church_id" uuid NOT NULL, CONSTRAINT "PK_880a0a07eae22018aaf8704b2aa" PRIMARY KEY ("user_id", "church_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9549d38cf03235fd9b38def2ca" ON "user_churches" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc497a9e71b4668728fbfda345" ON "user_churches" ("church_id") `,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "user_name" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_074a1f262efaca6aba16f7ed920" UNIQUE ("user_name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_churches" ADD CONSTRAINT "FK_9549d38cf03235fd9b38def2ca1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_churches" ADD CONSTRAINT "FK_cc497a9e71b4668728fbfda3459" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_churches" DROP CONSTRAINT "FK_cc497a9e71b4668728fbfda3459"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_churches" DROP CONSTRAINT "FK_9549d38cf03235fd9b38def2ca1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_074a1f262efaca6aba16f7ed920"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_name"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cc497a9e71b4668728fbfda345"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9549d38cf03235fd9b38def2ca"`,
    );
    await queryRunner.query(`DROP TABLE "user_churches"`);
  }
}
