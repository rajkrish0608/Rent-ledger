import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/export_model.dart';
import '../../data/repositories/export_repository_impl.dart';
import 'providers.dart'; // for dioProvider

final exportRepositoryProvider = Provider<ExportRepositoryImpl>((ref) {
  final dio = ref.watch(dioProvider);
  return ExportRepositoryImpl(dio);
});

// StateNotifier for creating export
class ExportController extends StateNotifier<AsyncValue<Export?>> {
  final ExportRepositoryImpl _repository;

  ExportController(this._repository) : super(const AsyncData(null));

  Future<Export?> createExport(String rentalId) async {
    state = const AsyncLoading();
    try {
      final export = await _repository.createExport(rentalId);
      state = AsyncData(export);
      return export;
    } catch (e, stack) {
      state = AsyncError(e, stack);
      return null;
    }
  }
}

final exportControllerProvider = StateNotifierProvider<ExportController, AsyncValue<Export?>>((ref) {
  final repository = ref.watch(exportRepositoryProvider);
  return ExportController(repository);
});

// Provider for fetching export status (auto-refreshable manually)
final exportStatusProvider = FutureProvider.family<Export, String>((ref, exportId) async {
  final repository = ref.watch(exportRepositoryProvider);
  return repository.getExport(exportId);
});

// Provider for download URL
final exportDownloadUrlProvider = FutureProvider.family<String, String>((ref, exportId) async {
  final repository = ref.watch(exportRepositoryProvider);
  return repository.getDownloadUrl(exportId);
});
