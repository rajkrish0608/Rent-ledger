// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rental_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RentalModel _$RentalModelFromJson(Map<String, dynamic> json) => RentalModel(
      id: json['id'] as String,
      propertyAddress: json['property_address'] as String,
      propertyUnit: json['property_unit'] as String?,
      startDate: json['start_date'] as String,
      endDate: json['end_date'] as String?,
      status: json['status'] as String,
      participants: (json['participants'] as List<dynamic>)
          .map((e) => ParticipantModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      eventCount: (json['event_count'] as num?)?.toInt(),
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
    );

Map<String, dynamic> _$RentalModelToJson(RentalModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'property_address': instance.propertyAddress,
      'property_unit': instance.propertyUnit,
      'start_date': instance.startDate,
      'end_date': instance.endDate,
      'status': instance.status,
      'participants': instance.participants,
      'event_count': instance.eventCount,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };

ParticipantModel _$ParticipantModelFromJson(Map<String, dynamic> json) =>
    ParticipantModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      joinedAt: json['joined_at'] as String,
      leftAt: json['left_at'] as String?,
    );

Map<String, dynamic> _$ParticipantModelToJson(ParticipantModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'user_id': instance.userId,
      'name': instance.name,
      'email': instance.email,
      'role': instance.role,
      'joined_at': instance.joinedAt,
      'left_at': instance.leftAt,
    };
