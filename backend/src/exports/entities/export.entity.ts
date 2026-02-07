import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Rental } from '../../rentals/entities/rental.entity';
import { User } from '../../users/entities/user.entity';

@Entity('exports')
export class Export {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Rental)
    @JoinColumn({ name: 'rental_id' })
    rental: Rental;

    @Column()
    rental_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'requested_by' })
    requester: User;

    @Column()
    requested_by: string;

    @Column({ default: 'PENDING' }) // PENDING, PROCESSING, COMPLETED, FAILED
    status: string;

    @Column({ nullable: true })
    s3_key: string;

    @Column({ nullable: true })
    download_url: string;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'text', nullable: true })
    error_message: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
