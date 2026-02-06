import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1707247200000 implements MigrationInterface {
    name = 'InitialSchema1707247200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "phone" VARCHAR(20) UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'TENANT',
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        "last_login" TIMESTAMP
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users"("email")
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_users_role" ON "users"("role")
    `);

        // Create rentals table
        await queryRunner.query(`
      CREATE TABLE "rentals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "property_address" TEXT NOT NULL,
        "property_unit" VARCHAR(50),
        "start_date" DATE NOT NULL,
        "end_date" DATE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "created_by" uuid REFERENCES "users"("id"),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_rentals_status" ON "rentals"("status")
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_rentals_created_at" ON "rentals"("created_at")
    `);

        // Create rental_events table (APPEND-ONLY)
        await queryRunner.query(`
      CREATE TABLE "rental_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rental_id" uuid NOT NULL REFERENCES "rentals"("id") ON DELETE CASCADE,
        "event_type" VARCHAR(50) NOT NULL,
        "event_data" JSONB NOT NULL,
        "actor_id" uuid REFERENCES "users"("id"),
        "actor_type" VARCHAR(20),
        "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
        "previous_event_hash" VARCHAR(64),
        "current_event_hash" VARCHAR(64) NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_rental_events_rental" ON "rental_events"("rental_id", "timestamp" DESC)
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_rental_events_type" ON "rental_events"("event_type")
    `);

        // Create trigger to prevent updates/deletes on rental_events
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_event_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'rental_events table is append-only. Modifications are not allowed.';
      END;
      $$ LANGUAGE plpgsql;
    `);

        await queryRunner.query(`
      CREATE TRIGGER prevent_update_trigger
      BEFORE UPDATE ON "rental_events"
      FOR EACH ROW EXECUTE FUNCTION prevent_event_modification();
    `);

        await queryRunner.query(`
      CREATE TRIGGER prevent_delete_trigger
      BEFORE DELETE ON "rental_events"
      FOR EACH ROW EXECUTE FUNCTION prevent_event_modification();
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS prevent_delete_trigger ON "rental_events"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS prevent_update_trigger ON "rental_events"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_event_modification()`);
        await queryRunner.query(`DROP TABLE "rental_events"`);
        await queryRunner.query(`DROP TABLE "rentals"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
