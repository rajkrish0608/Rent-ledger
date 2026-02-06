import { User } from '../../users/entities/user.entity';

export class AuthResponseDto {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    accessToken: string;
    refreshToken: string;

    constructor(user: User, accessToken: string, refreshToken: string) {
        this.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
