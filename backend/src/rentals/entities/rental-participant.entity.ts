import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Rental } from './rental.entity';
import { User } from '../../users/entities/user.entity';

@Entity('rental_participants')
export class RentalParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Rental)
    @JoinColumn({ name: 'rental_id' })
    rental: Rental;

    @Column()
    rental_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    user_id: string;

    @Column()
    role: string; // TENANT, LANDLORD, BROKER

    @CreateDateColumn()
    joined_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    left_at: Date;
}
