export class ParticipantResponseDto {
    id: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
    joined_at: string;
    left_at?: string;
}

export class RentalResponseDto {
    id: string;
    property_address: string;
    property_unit?: string;
    start_date: string;
    end_date?: string;
    status: string;
    participants: ParticipantResponseDto[];
    event_count?: number;
    created_at: string;
    updated_at: string;
}
