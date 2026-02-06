import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert,
} from 'typeorm';
import { Rental } from '../../rentals/entities/rental.entity';
import { User } from '../../users/entities/user.entity';

@Entity('rental_events')
export class RentalEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Rental)
    @JoinColumn({ name: 'rental_id' })
    rental: Rental;

    @Column()
    event_type: string;

    @Column({ type: 'jsonb' })
    event_data: Record<string, any>;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'actor_id' })
    actor: User;

    @Column()
    actor_type: string;

    @Column({ type: 'timestamp' })
    timestamp: Date;

    @Column({ nullable: true })
    previous_event_hash: string;

    @Column()
    current_event_hash: string;

    @CreateDateColumn()
    created_at: Date;

    @BeforeInsert()
    setTimestamp() {
        if (!this.timestamp) {
            this.timestamp = new Date();
        }
    }
}
