import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true, nullable: true })
    phone: string;

    @Column()
    password_hash: string;

    @Column()
    name: string;

    @Column({ default: 'TENANT' })
    role: string; // TENANT, LANDLORD, BROKER, SOCIETY_ADMIN, INTERNAL_ADMIN

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    last_login: Date;
}
