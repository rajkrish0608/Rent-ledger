import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsString()
    @MinLength(2)
    name: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsEnum(['TENANT', 'LANDLORD', 'BROKER', 'SOCIETY_ADMIN'], {
        message: 'Role must be one of: TENANT, LANDLORD, BROKER, SOCIETY_ADMIN',
    })
    role: string;
}
