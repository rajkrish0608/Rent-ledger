import 'dart:io';
import 'package:dio/dio.dart';
import '../../domain/repositories/media_repository.dart';
import '../../core/constants/app_constants.dart';

class MediaRepositoryImpl implements MediaRepository {
  final Dio _client; // Authenticated client for backend API

  MediaRepositoryImpl(this._client);

  @override
  Future<String> uploadFile(File file) async {
    try {
      final fileName = file.path.split('/').last;
      final mimeType = _getMimeType(fileName);
      final fileSize = await file.length();

      // 1. Get Presigned URL
      final response = await _client.post(
        '/media/upload-url', // Base URL handles /api prefix usually 
        data: {
          'filename': fileName,
          'mimetype': mimeType,
        },
      );

      final uploadUrl = response.data['uploadUrl'] as String;
      final key = response.data['key'] as String;

      // 2. Upload File (PUT)
      // Use a fresh Dio instance to avoid adding our Backend Auth Token to S3 requests
      // (S3 Signed URLs have their own auth params)
      final uploadClient = Dio(); 
      
      await uploadClient.put(
        uploadUrl,
        data: file.openRead(),
        options: Options(
          headers: {
            'Content-Type': mimeType,
            'Content-Length': fileSize,
          },
        ),
      );

      return key;
    } catch (e) {
      throw Exception('Upload failed: $e');
    }
  }

  String _getMimeType(String fileName) {
    final lower = fileName.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    return 'application/octet-stream';
  }

  @override
  Future<String> getDownloadUrl(String key) async {
    try {
      final response = await _client.post(
        '/media/download-url',
        data: {'key': key},
      );
      return response.data['downloadUrl'] as String;
    } catch (e) {
      throw Exception('Failed to get download URL: $e');
    }
  }
}
