import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Rental } from '../../rentals/entities/rental.entity';
import { RentalEvent } from '../../events/entities/rental-event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('media_files')
export class MediaFile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Rental)
    @JoinColumn({ name: 'rental_id' })
    rental: Rental;

    @ManyToOne(() => RentalEvent, { nullable: true })
    @JoinColumn({ name: 'event_id' })
    event: RentalEvent;

    @Column()
    file_type: string; // IMAGE, VIDEO, PDF

    @Column()
    file_name: string;

    @Column({ type: 'bigint' })
    file_size: number;

    @Column()
    mime_type: string;

    @Column({ default: 'S3' })
    storage_provider: string;

    @Column()
    storage_path: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ nullable: true })
    sha256_hash: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploaded_by' })
    uploaded_by: User;

    @CreateDateColumn()
    uploaded_at: Date;
}
