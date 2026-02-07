import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../data/models/dashboard/dashboard_stats.dart';
import '../../data/repositories/dashboard/dashboard_repository.dart';
import '../../data/repositories/society/society_repository.dart';

// Dio provider with auth interceptor
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  // Add interceptor to include JWT token
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final storage = ref.read(secureStorageProvider);
      final token = await storage.read(key: 'access_token');
      
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      
      return handler.next(options);
    },
    onError: (error, handler) async {
      // Handle 401 errors (token expired)
      if (error.response?.statusCode == 401) {
        final storage = ref.read(secureStorageProvider);
        final refreshToken = await storage.read(key: 'refresh_token');
        
        if (refreshToken != null) {
          try {
            // Try to refresh the token
            final response = await dio.post(
              ApiConstants.refresh,
              data: {'refresh_token': refreshToken},
            );
            
            final newAccessToken = response.data['access_token'];
            await storage.write(key: 'access_token', value: newAccessToken);
            
            // Retry the original request with new token
            error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
            final retryResponse = await dio.fetch(error.requestOptions);
            return handler.resolve(retryResponse);
          } catch (e) {
            // Refresh failed, clear tokens
            await storage.deleteAll();
            return handler.reject(error);
          }
        }
      }
      
      return handler.next(error);
    },
  ));

  return dio;
});

// Secure storage provider
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

// Auth remote data source provider
final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSource(ref.watch(dioProvider));
});

// Auth repository provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.watch(authRemoteDataSourceProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});

// Dashboard Repository Provider
final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepositoryImpl(ref.watch(dioProvider));
});

// Broker Stats Provider
final brokerStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.getBrokerStats();
});

// Society Repository Provider
final societyRepositoryProvider = Provider<SocietyRepository>((ref) {
  return SocietyRepositoryImpl(ref.watch(dioProvider));
});

// Society Rentals Provider
final societyRentalsProvider = FutureProvider<List<Rental>>((ref) async {
  final repository = ref.watch(societyRepositoryProvider);
  return repository.getSocietyRentals();
});
