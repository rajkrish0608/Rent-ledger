import { IsNotEmpty, IsString, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ParticipantDto {
    @IsNotEmpty()
    @IsString()
    user_id: string;

    @IsNotEmpty()
    @IsString()
    role: 'TENANT' | 'LANDLORD' | 'BROKER';
}

export class CreateRentalDto {
    @IsNotEmpty()
    @IsString()
    property_address: string;

    @IsOptional()
    @IsString()
    property_unit?: string;

    @IsNotEmpty()
    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ParticipantDto)
    participants?: ParticipantDto[];
}
