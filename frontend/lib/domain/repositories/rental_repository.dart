import '../entities/rental.dart';
import '../entities/rental_event.dart';

abstract class RentalRepository {
  Future<Rental> createRental({
    required String propertyAddress,
    String? propertyUnit,
    required DateTime startDate,
    List<Map<String, String>>? participants,
  });

  Future<Rental> getRentalById(String id);

  Future<List<Rental>> getMyRentals();

  Future<Rental> closeRental(String id);

  Future<Map<String, dynamic>> verifyRentalIntegrity(String id);

  Future<RentalEvent> createEvent({
    required String rentalId,
    required EventType eventType,
    required Map<String, dynamic> eventData,
    required ActorType actorType,
  });

  Future<List<RentalEvent>> getEventsByRental(
    String rentalId, {
    int page = 1,
    int limit = 20,
  });

  Future<RentalEvent> getEventById(String id);
}
