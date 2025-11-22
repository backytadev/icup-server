import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserMinistyPivotTable1763823764107
  implements MigrationInterface
{
  name = 'CreateUserMinistyPivotTable1763823764107';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_ministry" ("user_id" uuid NOT NULL, "ministry_id" uuid NOT NULL, CONSTRAINT "PK_33290fcef353b84d5dd7b69d0ad" PRIMARY KEY ("user_id", "ministry_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43abe60c22289201638642b0e7" ON "user_ministry" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f9a544b9b35e11636364a77d3" ON "user_ministry" ("ministry_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ministry" ADD CONSTRAINT "FK_43abe60c22289201638642b0e7e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ministry" ADD CONSTRAINT "FK_0f9a544b9b35e11636364a77d3c" FOREIGN KEY ("ministry_id") REFERENCES "ministries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_ministry" DROP CONSTRAINT "FK_0f9a544b9b35e11636364a77d3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ministry" DROP CONSTRAINT "FK_43abe60c22289201638642b0e7e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0f9a544b9b35e11636364a77d3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43abe60c22289201638642b0e7"`,
    );
    await queryRunner.query(`DROP TABLE "user_ministry"`);
  }
}
