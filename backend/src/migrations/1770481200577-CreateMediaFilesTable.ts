import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMediaFilesTable1770481200577 implements MigrationInterface {
    name = 'CreateMediaFilesTable1770481200577'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create new tables
        await queryRunner.query(`CREATE TABLE "societies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b09a5aefa2136f1f5444548ce3e" UNIQUE ("name"), CONSTRAINT "PK_e0564d9c676def9b22cc88a02a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reputation_signals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "signal_type" character varying NOT NULL, "signal_value" jsonb NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "rental_id" uuid, CONSTRAINT "PK_9d575c42725d85756fd6d1c134c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "media_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_type" character varying NOT NULL, "file_name" character varying NOT NULL, "file_size" bigint NOT NULL, "mime_type" character varying NOT NULL, "storage_provider" character varying NOT NULL DEFAULT 'S3', "storage_path" character varying NOT NULL, "metadata" jsonb, "sha256_hash" character varying, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "rental_id" uuid, "event_id" uuid, "uploaded_by" uuid, CONSTRAINT "PK_93b4da6741cd150e76f9ac035d8" PRIMARY KEY ("id"))`);

        // Add society_id to users
        await queryRunner.query(`ALTER TABLE "users" ADD "society_id" uuid`);

        // Add foreign keys for new tables/relations
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_e6c3121a99f94002c6535d01ecc" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reputation_signals" ADD CONSTRAINT "FK_a0577ce55cc042b066aa80f59bc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reputation_signals" ADD CONSTRAINT "FK_965f4a486a6a134e51756befd6f" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "media_files" ADD CONSTRAINT "FK_19f4b8e9b4b8b52a50aaed1de1c" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media_files" ADD CONSTRAINT "FK_59c9cc0feb57429843590ae9f09" FOREIGN KEY ("event_id") REFERENCES "rental_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media_files" ADD CONSTRAINT "FK_78f2e01705ad1a9b77ef3ee3777" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "exports" DROP CONSTRAINT "FK_82fbfceb735f3dd721154759258"`);
        await queryRunner.query(`ALTER TABLE "exports" DROP CONSTRAINT "FK_3ca30bae63a58e3d5248e446767"`);
        await queryRunner.query(`ALTER TABLE "media_files" DROP CONSTRAINT "FK_78f2e01705ad1a9b77ef3ee3777"`);
        await queryRunner.query(`ALTER TABLE "media_files" DROP CONSTRAINT "FK_59c9cc0feb57429843590ae9f09"`);
        await queryRunner.query(`ALTER TABLE "media_files" DROP CONSTRAINT "FK_19f4b8e9b4b8b52a50aaed1de1c"`);
        await queryRunner.query(`ALTER TABLE "rental_events" DROP CONSTRAINT "FK_42c70c6c740a6d5d138c86de22c"`);
        await queryRunner.query(`ALTER TABLE "rental_events" DROP CONSTRAINT "FK_23472e809a7d56091b5cef2b7e7"`);
        await queryRunner.query(`ALTER TABLE "rental_participants" DROP CONSTRAINT "FK_2f83c7882cfe5baf213fefed3af"`);
        await queryRunner.query(`ALTER TABLE "rental_participants" DROP CONSTRAINT "FK_5e0dea7080cb1ba9d8621773923"`);
        await queryRunner.query(`ALTER TABLE "reputation_signals" DROP CONSTRAINT "FK_965f4a486a6a134e51756befd6f"`);
        await queryRunner.query(`ALTER TABLE "reputation_signals" DROP CONSTRAINT "FK_a0577ce55cc042b066aa80f59bc"`);
        await queryRunner.query(`ALTER TABLE "rentals" DROP CONSTRAINT "FK_2ad7854cffbb2de1e0ff5c855a4"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_e6c3121a99f94002c6535d01ecc"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rental_events" ALTER COLUMN "rental_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rental_events" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rental_events" DROP COLUMN "current_event_hash"`);
        await queryRunner.query(`ALTER TABLE "rental_events" ADD "current_event_hash" character varying(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rental_events" DROP COLUMN "previous_event_hash"`);
        await queryRunner.query(`ALTER TABLE "rental_events" ADD "previous_event_hash" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "rental_events" ALTER COLUMN "timestamp" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "rental_events" DROP COLUMN "actor_type"`);
        await queryRunner.query(`ALTER TABLE "rental_events" ADD "actor_type" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "rental_events" DROP COLUMN "event_type"`);
        await queryRunner.query(`ALTER TABLE "rental_events" ADD "event_type" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rental_participants" ALTER COLUMN "joined_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rental_participants" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "rental_participants" ADD "role" character varying(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rentals" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rentals" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rentals" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "rentals" ADD "status" character varying(20) NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "rentals" DROP COLUMN "property_unit"`);
        await queryRunner.query(`ALTER TABLE "rentals" ADD "property_unit" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying(50) NOT NULL DEFAULT 'TENANT'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_phone_key" UNIQUE ("phone")`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "society_id"`);
        await queryRunner.query(`DROP TABLE "media_files"`);
        await queryRunner.query(`DROP TABLE "reputation_signals"`);
        await queryRunner.query(`DROP TABLE "societies"`);
        await queryRunner.query(`ALTER TABLE "rental_participants" ADD CONSTRAINT "rental_participants_rental_id_user_id_role_key" UNIQUE ("rental_id", "user_id", "role")`);
        await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens" ("token") `);
        await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_rental_events_type" ON "rental_events" ("event_type") `);
        await queryRunner.query(`CREATE INDEX "idx_rental_events_rental" ON "rental_events" ("rental_id", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_rental_participants_user" ON "rental_participants" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_rental_participants_rental" ON "rental_participants" ("rental_id") `);
        await queryRunner.query(`CREATE INDEX "idx_rentals_created_at" ON "rentals" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_rentals_status" ON "rentals" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rental_events" ADD CONSTRAINT "rental_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rental_events" ADD CONSTRAINT "rental_events_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rental_participants" ADD CONSTRAINT "rental_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rental_participants" ADD CONSTRAINT "rental_participants_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rentals" ADD CONSTRAINT "rentals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
