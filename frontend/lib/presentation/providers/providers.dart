import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/repositories/auth_repository.dart';

// Dio provider
final dioProvider = Provider\u003cDio\u003e((ref) {
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

  return dio;
});

// Secure storage provider
final secureStorageProvider = Provider\u003cFlutterSecureStorage\u003e((ref) {
  return const FlutterSecureStorage();
});

// Auth remote data source provider
final authRemoteDataSourceProvider = Provider\u003cAuthRemoteDataSource\u003e((ref) {
  return AuthRemoteDataSource(ref.watch(dioProvider));
});

// Auth repository provider
final authRepositoryProvider = Provider\u003cAuthRepository\u003e((ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.watch(authRemoteDataSourceProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});
