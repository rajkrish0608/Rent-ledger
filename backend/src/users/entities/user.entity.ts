import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Society } from '../../society/entities/society.entity';

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

    @ManyToOne(() => Society, (society) => society.admins, { nullable: true })
    @JoinColumn({ name: 'society_id' })
    society: Society;

    @Column({ nullable: true })
    fcm_token: string;
}
