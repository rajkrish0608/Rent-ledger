import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/export_provider.dart';
import '../../../core/constants/app_constants.dart';

class EvidenceScreen extends ConsumerStatefulWidget {
  final String rentalId;

  const EvidenceScreen({Key? key, required this.rentalId}) : super(key: key);

  @override
  ConsumerState<EvidenceScreen> createState() => _EvidenceScreenState();
}

class _EvidenceScreenState extends ConsumerState<EvidenceScreen> {
  String? _currentExportId;

  @override
  Widget build(BuildContext context) {
    // Watch status if we have an export ID
    final statusAsync = _currentExportId != null
        ? ref.watch(exportStatusProvider(_currentExportId!))
        : null;

    final createAsync = ref.watch(exportControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Evidence & Reports'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Icon(Icons.description, size: 48, color: Colors.blue),
                    SizedBox(height: 16),
                    Text(
                      'Export Rental History',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Generate a PDF report including rental agreement details, participant history, and a cryptographically verified timeline of events.',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Create / Status Section
            if (_currentExportId == null && !createAsync.isLoading)
              ElevatedButton.icon(
                onPressed: _generateReport,
                icon: const Icon(Icons.picture_as_pdf),
                label: const Text('Generate PDF Report'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              )
            else if (createAsync.isLoading)
              const Center(child: CircularProgressIndicator())
            else if (statusAsync != null)
              statusAsync.when(
                data: (export) {
                  if (export.status == 'COMPLETED') {
                    return Column(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green, size: 64),
                        const SizedBox(height: 16),
                        const Text('Report Generated Successfully!'),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => _downloadReport(export.id),
                          icon: const Icon(Icons.download),
                          label: const Text('Download PDF'),
                        ),
                      ],
                    );
                  } else if (export.status == 'FAILED') {
                    return Column(
                      children: [
                        const Icon(Icons.error, color: Colors.red, size: 64),
                        const SizedBox(height: 16),
                        Text('Generation Failed: ${export.errorMessage}'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _generateReport,
                          child: const Text('Retry'),
                        ),
                      ],
                    );
                  } else {
                    // Pending / Processing
                    return Column(
                      children: [
                        const CircularProgressIndicator(),
                        const SizedBox(height: 16),
                        Text('Status: ${export.status}'),
                        const Text('Please wait while we secure your data...'),
                        // Poll periodically
                        TextButton(
                          onPressed: () => ref.refresh(exportStatusProvider(export.id)),
                          child: const Text('Check Status'),
                        ),
                      ],
                    );
                  }
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Text('Error checking status: $err'),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _generateReport() async {
    final controller = ref.read(exportControllerProvider.notifier);
    final export = await controller.createExport(widget.rentalId);
    
    if (export != null) {
      if (mounted) {
        setState(() {
          _currentExportId = export.id;
        });
        _pollStatus(export.id);
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to start export')),
        );
      }
    }
  }

  Future<void> _pollStatus(String exportId) async {
    // Poll every 2 seconds for up to 30 seconds
    for (int i = 0; i < 15; i++) {
      if (!mounted) return;
      
      await Future.delayed(const Duration(seconds: 2));
      
      // Refresh the provider to get new status
      try {
        final status = await ref.refresh(exportStatusProvider(exportId).future);
        if (status.status == 'COMPLETED' || status.status == 'FAILED') {
          return;
        }
      } catch (e) {
        debugPrint('Polling error: $e');
      }
    }
  }

  Future<void> _downloadReport(String exportId) async {
    try {
      final urlString = await ref.read(exportDownloadUrlProvider(exportId).future);
      
      // If passing local dev URL, we need to prefix base URL if it's relative
      // But repo returns what backend gives.
      // Backend gives: /api/exports/download-local/...
      // This is relative path.
      // url_launcher requires absolute URL.
      
      String finalUrl = urlString;
      if (urlString.startsWith('/')) {
         finalUrl = ApiConstants.baseUrl.replaceAll('/api', '') + urlString;
      }
      
      final uri = Uri.parse(finalUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not launch $finalUrl')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error getting download URL: $e')),
        );
      }
    }
  }
}
