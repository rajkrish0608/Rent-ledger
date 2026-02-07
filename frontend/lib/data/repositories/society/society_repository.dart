import 'package:dio/dio.dart';
import '../../../core/error/failures.dart';
import '../../../domain/entities/rental.dart';
import '../../models/rental_model.dart';

abstract class SocietyRepository {
  Future<List<Rental>> getSocietyRentals();
}

class SocietyRepositoryImpl implements SocietyRepository {
  final Dio _dio;

  SocietyRepositoryImpl(this._dio);

  @override
  Future<List<Rental>> getSocietyRentals() async {
    try {
      final response = await _dio.get('/society/rentals');
      final List<dynamic> data = response.data;
      return data.map<Rental>((json) => RentalModel.fromJson(json as Map<String, dynamic>).toEntity()).toList();
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data['message'] ?? 'Failed to fetch society rentals',
      );
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }
}
