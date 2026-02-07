class Rental {
  final String id;
  final String propertyAddress;
  final String? propertyUnit;
  final DateTime startDate;
  final DateTime? endDate;
  final RentalStatus status;
  final List<Participant> participants;
  final int? eventCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Rental({
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
}

enum RentalStatus {
  active,
  closed;

  String get displayName {
    switch (this) {
      case RentalStatus.active:
        return 'Active';
      case RentalStatus.closed:
        return 'Closed';
    }
  }
}

class Participant {
  final String id;
  final String userId;
  final String name;
  final String email;
  final ParticipantRole role;
  final DateTime joinedAt;
  final DateTime? leftAt;

  const Participant({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    required this.role,
    required this.joinedAt,
    this.leftAt,
  });
}

enum ParticipantRole {
  tenant,
  landlord,
  broker;

  String get displayName {
    switch (this) {
      case ParticipantRole.tenant:
        return 'Tenant';
      case ParticipantRole.landlord:
        return 'Landlord';
      case ParticipantRole.broker:
        return 'Broker';
    }
  }
}
