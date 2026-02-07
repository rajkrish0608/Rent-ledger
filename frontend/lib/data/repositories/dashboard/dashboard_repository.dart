import 'package:dio/dio.dart';
import '../../../core/error/failures.dart';
import '../../models/dashboard/dashboard_stats.dart';

abstract class DashboardRepository {
  Future<DashboardStats> getBrokerStats();
  // Future<List<Rental>> getDisputeRentals(); // TODO: Implement when model ready
}

class DashboardRepositoryImpl implements DashboardRepository {
  final Dio _dio;

  DashboardRepositoryImpl(this._dio);

  @override
  Future<DashboardStats> getBrokerStats() async {
    try {
      final response = await _dio.get('/dashboard/stats');
      return DashboardStats.fromJson(response.data);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data['message'] ?? 'Failed to fetch dashboard stats',
      );
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }
}
