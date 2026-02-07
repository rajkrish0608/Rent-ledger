import 'package:dio/dio.dart';
import '../../domain/entities/rental.dart';
import '../../domain/entities/rental_event.dart';
import '../../domain/repositories/rental_repository.dart';
import '../models/rental_model.dart';
import '../models/rental_event_model.dart';
import '../../core/constants/api_constants.dart';

class RentalRepositoryImpl implements RentalRepository {
  final Dio dio;

  RentalRepositoryImpl(this.dio);

  @Override
  Future<Rental> createRental({
    required String propertyAddress,
    String? propertyUnit,
    required DateTime startDate,
    List<Map<String, String>>? participants,
  }) async {
    try {
      final response = await dio.post(
        ApiConstants.rentals,
        data: {
          'property_address': propertyAddress,
          'property_unit': propertyUnit,
          'start_date': startDate.toIso8601String(),
          'participants': participants,
        },
      );

      final model = RentalModel.fromJson(response.data);
      return model.toEntity();
    } catch (e) {
      throw Exception('Failed to create rental: $e');
    }
  }

  @Override
  Future<Rental> getRentalById(String id) async {
    try {
      final response = await dio.get('${ApiConstants.rentals}/$id');
      final model = RentalModel.fromJson(response.data);
      return model.toEntity();
    } catch (e) {
      throw Exception('Failed to get rental: $e');
    }
  }

  @Override
  Future<List<Rental>> getMyRentals() async {
    try {
      final response = await dio.get(ApiConstants.rentals);
      final List<dynamic> data = response.data;
      return data.map((json) => RentalModel.fromJson(json).toEntity()).toList();
    } catch (e) {
      throw Exception('Failed to get rentals: $e');
    }
  }

  @Override
  Future<Rental> closeRental(String id) async {
    try {
      final response = await dio.post('${ApiConstants.rentals}/$id/close');
      final model = RentalModel.fromJson(response.data);
      return model.toEntity();
    } catch (e) {
      throw Exception('Failed to close rental: $e');
    }
  }

  @Override
  Future<Map<String, dynamic>> verifyRentalIntegrity(String id) async {
    try {
      final response = await dio.get('${ApiConstants.rentals}/$id/verify');
      return response.data;
    } catch (e) {
      throw Exception('Failed to verify rental integrity: $e');
    }
  }

  @Override
  Future<RentalEvent> createEvent({
    required String rentalId,
    required EventType eventType,
    required Map<String, dynamic> eventData,
    required ActorType actorType,
  }) async {
    try {
      final response = await dio.post(
        ApiConstants.events,
        data: {
          'rental_id': rentalId,
          'event_type': eventType.value,
          'event_data': eventData,
          'actor_type': actorType.value,
        },
      );

      final model = RentalEventModel.fromJson(response.data);
      return model.toEntity();
    } catch (e) {
      throw Exception('Failed to create event: $e');
    }
  }

  @Override
  Future<List<RentalEvent>> getEventsByRental(
    String rentalId, {
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await dio.get(
        '${ApiConstants.events}/rental/$rentalId',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> events = response.data['events'];
      return events
          .map((json) => RentalEventModel.fromJson(json).toEntity())
          .toList();
    } catch (e) {
      throw Exception('Failed to get events: $e');
    }
  }

  @Override
  Future<RentalEvent> getEventById(String id) async {
    try {
      final response = await dio.get('${ApiConstants.events}/$id');
      final model = RentalEventModel.fromJson(response.data);
      return model.toEntity();
    } catch (e) {
      throw Exception('Failed to get event: $e');
    }
  }
}
