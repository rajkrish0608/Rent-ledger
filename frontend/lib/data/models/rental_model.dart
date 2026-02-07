import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/rental.dart';

part 'rental_model.g.dart';

@JsonSerializable()
class RentalModel {
  final String id;
  @JsonKey(name: 'property_address')
  final String propertyAddress;
  @JsonKey(name: 'property_unit')
  final String? propertyUnit;
  @JsonKey(name: 'start_date')
  final String startDate;
  @JsonKey(name: 'end_date')
  final String? endDate;
  final String status;
  final List<ParticipantModel> participants;
  @JsonKey(name: 'event_count')
  final int? eventCount;
  @JsonKey(name: 'created_at')
  final String createdAt;
  @JsonKey(name: 'updated_at')
  final String updatedAt;

  RentalModel({
    required this.id,
    required this.propertyAddress,
    this.propertyUnit,
    required this.startDate,
    this.endDate,
    required this.status,
    required this.participants,
    this.eventCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RentalModel.fromJson(Map<String, dynamic> json) =>
      _$RentalModelFromJson(json);

  Map<String, dynamic> toJson() => _$RentalModelToJson(this);

  Rental toEntity() {
    return Rental(
      id: id,
      propertyAddress: propertyAddress,
      propertyUnit: propertyUnit,
      startDate: DateTime.parse(startDate),
      endDate: endDate != null ? DateTime.parse(endDate!) : null,
      status: status == 'ACTIVE' ? RentalStatus.active : RentalStatus.closed,
      participants: participants.map((p) => p.toEntity()).toList(),
      eventCount: eventCount,
      createdAt: DateTime.parse(createdAt),
      updatedAt: DateTime.parse(updatedAt),
    );
  }
}

@JsonSerializable()
class ParticipantModel {
  final String id;
  @JsonKey(name: 'user_id')
  final String userId;
  final String name;
  final String email;
  final String role;
  @JsonKey(name: 'joined_at')
  final String joinedAt;
  @JsonKey(name: 'left_at')
  final String? leftAt;

  ParticipantModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    required this.role,
    required this.joinedAt,
    this.leftAt,
  });

  factory ParticipantModel.fromJson(Map<String, dynamic> json) =>
      _$ParticipantModelFromJson(json);

  Map<String, dynamic> toJson() => _$ParticipantModelToJson(this);

  Participant toEntity() {
    ParticipantRole roleEnum;
    switch (role.toUpperCase()) {
      case 'TENANT':
        roleEnum = ParticipantRole.tenant;
        break;
      case 'LANDLORD':
        roleEnum = ParticipantRole.landlord;
        break;
      case 'BROKER':
        roleEnum = ParticipantRole.broker;
        break;
      default:
        roleEnum = ParticipantRole.broker;
    }

    return Participant(
      id: id,
      userId: userId,
      name: name,
      email: email,
      role: roleEnum,
      joinedAt: DateTime.parse(joinedAt),
      leftAt: leftAt != null ? DateTime.parse(leftAt!) : null,
    );
  }
}
