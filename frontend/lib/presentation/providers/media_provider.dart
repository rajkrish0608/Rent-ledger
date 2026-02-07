import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/repositories/media_repository.dart';
import '../../data/repositories/media_repository_impl.dart';
import 'providers.dart';

final mediaRepositoryProvider = Provider<MediaRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return MediaRepositoryImpl(dio);
});

final mediaDownloadUrlProvider = FutureProvider.family<String, String>((ref, key) async {
  final repo = ref.watch(mediaRepositoryProvider);
  return repo.getDownloadUrl(key);
});

final mediaUploadControllerProvider = StateNotifierProvider<MediaUploadController, AsyncValue<String?>>((ref) {
  return MediaUploadController(ref.watch(mediaRepositoryProvider));
});

class MediaUploadController extends StateNotifier<AsyncValue<String?>> {
  final MediaRepository _repository;

  MediaUploadController(this._repository) : super(const AsyncData(null));

  Future<String?> uploadFile(File file) async {
    state = const AsyncLoading();
    try {
      final key = await _repository.uploadFile(file);
      state = AsyncData(key);
      return key;
    } catch (e, stack) {
      state = AsyncError(e, stack);
      return null;
    }
  }
}
