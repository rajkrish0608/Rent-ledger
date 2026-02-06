import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokens1707250000000 implements MigrationInterface {
    name = 'AddRefreshTokens1707250000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" VARCHAR(500) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens"("user_id")
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens"("token")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }
}
