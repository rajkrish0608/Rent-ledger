import '../entities/export_model.dart';

abstract class ExportRepository {
  Future<Export> createExport(String rentalId);
  Future<Export> getExport(String exportId);
  Future<String> getDownloadUrl(String exportId);
}
