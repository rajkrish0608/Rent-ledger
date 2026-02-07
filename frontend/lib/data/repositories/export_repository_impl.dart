import 'package:dio/dio.dart';
import '../../domain/entities/export_model.dart';
import '../../domain/repositories/export_repository.dart';
import '../../core/constants/app_constants.dart';

class ExportRepositoryImpl implements ExportRepository {
  final Dio dio;

  ExportRepositoryImpl(this.dio);

  @override
  Future<Export> createExport(String rentalId) async {
    try {
      final response = await dio.post(
        ApiConstants.exports,
        data: {'rental_id': rentalId, 'options': {'format': 'pdf'}},
      );
      return Export.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to create export: $e');
    }
  }

  @override
  Future<Export> getExport(String exportId) async {
    try {
      final response = await dio.get(ApiConstants.exportStatus(exportId));
      return Export.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to get export status: $e');
    }
  }

  @override
  Future<String> getDownloadUrl(String exportId) async {
    try {
      final response = await dio.get(ApiConstants.exportDownload(exportId));
      return response.data['url'];
    } catch (e) {
      throw Exception('Failed to get download URL: $e');
    }
  }
}
