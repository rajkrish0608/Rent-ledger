import { IsNotEmpty, IsString, IsObject, IsOptional, IsEnum } from 'class-validator';

export enum EventType {
    MOVE_IN = 'MOVE_IN',
    MOVE_OUT = 'MOVE_OUT',
    RENT_PAID = 'RENT_PAID',
    RENT_DELAYED = 'RENT_DELAYED',
    REPAIR_REQUEST = 'REPAIR_REQUEST',
    REPAIR_COMPLETED = 'REPAIR_COMPLETED',
    NOTICE_ISSUED = 'NOTICE_ISSUED',
    COMPLAINT = 'COMPLAINT',
    INSPECTION = 'INSPECTION',
}

export class CreateEventDto {
    @IsOptional()
    @IsString()
    rental_id?: string; // Will be set from route param

    @IsNotEmpty()
    @IsEnum(EventType)
    event_type: EventType;

    @IsNotEmpty()
    @IsObject()
    event_data: Record<string, any>;

    @IsNotEmpty()
    @IsString()
    actor_type: string; // TENANT, LANDLORD, BROKER, SOCIETY, SYSTEM
}
