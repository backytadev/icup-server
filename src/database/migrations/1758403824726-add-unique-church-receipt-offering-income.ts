import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueChurchReceiptOfferingIncome1758403824726
  implements MigrationInterface
{
  name = 'AddUniqueChurchReceiptOfferingIncome1758403824726';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "offering_income" RENAME COLUMN "receiptCode" TO "receipt_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offering_income" RENAME CONSTRAINT "UQ_5736c1c6bc6531021439ed7cb6c" TO "UQ_9d8998163a6391c8d7de8e34b1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offering_income" DROP CONSTRAINT "UQ_9d8998163a6391c8d7de8e34b1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offering_income" ADD CONSTRAINT "UQ_c766c860f45e31066eec683673c" UNIQUE ("church_id", "receipt_code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "offering_income" DROP CONSTRAINT "UQ_c766c860f45e31066eec683673c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offering_income" ADD CONSTRAINT "UQ_9d8998163a6391c8d7de8e34b1c" UNIQUE ("receipt_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "offering_income" RENAME CONSTRAINT "UQ_9d8998163a6391c8d7de8e34b1c" TO "UQ_5736c1c6bc6531021439ed7cb6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offering_income" RENAME COLUMN "receipt_code" TO "receiptCode"`,
    );
  }
}
