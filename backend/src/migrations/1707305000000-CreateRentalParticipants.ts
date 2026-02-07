import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRentalParticipants1707305000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE rental_participants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id),
                role VARCHAR(20) NOT NULL,
                joined_at TIMESTAMP DEFAULT NOW(),
                left_at TIMESTAMP,
                UNIQUE(rental_id, user_id, role)
            );
        `);

        await queryRunner.query(`
            CREATE INDEX idx_rental_participants_rental ON rental_participants(rental_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_rental_participants_user ON rental_participants(user_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS rental_participants CASCADE;`);
    }
}
