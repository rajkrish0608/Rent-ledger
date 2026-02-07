import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('societies')
export class Society {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column()
    address: string;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => User, (user) => user.society)
    admins: User[];
}
