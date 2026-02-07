import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Rental } from '../../rentals/entities/rental.entity';

@Entity('reputation_signals')
export class ReputationSignal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Rental)
    @JoinColumn({ name: 'rental_id' })
    rental: Rental;

    @Column()
    signal_type: string;

    @Column({ type: 'jsonb' })
    signal_value: any;

    @CreateDateColumn()
    timestamp: Date;
}
