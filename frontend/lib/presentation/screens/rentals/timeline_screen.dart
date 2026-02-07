import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../domain/entities/rental.dart';
import '../../../domain/entities/rental_event.dart';
import '../../providers/rental_providers.dart';

class TimelineScreen extends ConsumerWidget {
  final String rentalId;

  const TimelineScreen({
    Key? key,
    required this.rentalId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rentalAsync = ref.watch(rentalProvider(rentalId));
    final eventsAsync = ref.watch(rentalEventsProvider(rentalId));

    return Scaffold(
      body: rentalAsync.when(
        data: (rental) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 200,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(
                  rental.propertyAddress,
                  style: const TextStyle(fontSize: 16),
                ),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Theme.of(context).primaryColor,
                        Theme.of(context).primaryColor.withOpacity(0.7),
                      ],
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 80, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (rental.propertyUnit != null)
                          Text(
                            'Unit: ${rental.propertyUnit}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            rental.status.displayName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.verified_user),
                  onPressed: () => _verifyIntegrity(context, ref),
                  tooltip: 'Verify Hash Chain',
                ),
                IconButton(
                  icon: const Icon(Icons.more_vert),
                  onPressed: () => _showOptions(context, ref),
                ),
              ],
            ),
            eventsAsync.when(
              data: (events) {
                if (events.isEmpty) {
                  return SliverFillRemaining(
                    child: _buildEmptyState(context),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final event = events[index];
                        final isFirst = index == 0;
                        final isLast = index == events.length - 1;
                        
                        return _EventCard(
                          event: event,
                          isFirst: isFirst,
                          isLast: isLast,
                        );
                      },
                      childCount: events.length,
                    ),
                  ),
                );
              },
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, stack) => SliverFillRemaining(
                child: Center(child: Text('Error loading events: $error')),
              ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/rentals/$rentalId/add-event'),
        icon: const Icon(Icons.add),
        label: const Text('Add Event'),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.timeline,
            size: 100,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 24),
          Text(
            'No Events Yet',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start documenting rental events',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[500],
                ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => context.push('/rentals/$rentalId/add-event'),
            icon: const Icon(Icons.add),
            label: const Text('Add First Event'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _verifyIntegrity(BuildContext context, WidgetRef ref) async {
    showDialog(
      context: context,
      builder: (context) => const AlertDialog(
        title: Text('Verifying...'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Checking hash chain integrity'),
          ],
        ),
      ),
    );

    try {
      final repository = ref.read(rentalRepositoryProvider);
      final result = await repository.verifyRentalIntegrity(rentalId);
      
      Navigator.pop(context);
      
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Row(
            children: [
              Icon(
                result['valid'] ? Icons.check_circle : Icons.error,
                color: result['valid'] ? Colors.green : Colors.red,
              ),
              const SizedBox(width: 8),
              Text(result['valid'] ? 'Verified' : 'Integrity Issue'),
            ],
          ),
          content: Text(
            result['valid']
                ? 'All events are cryptographically linked. The timeline is tamper-evident and court-admissible.'
                : 'Hash chain verification failed. Errors: ${result['errors'].join(', ')}',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _showOptions(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.download),
              title: const Text('Export Evidence'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to export screen
              },
            ),
            ListTile(
              leading: const Icon(Icons.person_add),
              title: const Text('Add Participant'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to add participant screen
              },
            ),
            ListTile(
              leading: const Icon(Icons.close),
              title: const Text('Close Rental'),
              onTap: () async {
                Navigator.pop(context);
                _closeRental(context, ref);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _closeRental(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Close Rental'),
        content: const Text(
          'Are you sure you want to close this rental? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Close Rental'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final repository = ref.read(rentalRepositoryProvider);
        await repository.closeRental(rentalId);
        ref.invalidate(rentalProvider(rentalId));
        ref.invalidate(myRentalsProvider);
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Rental closed successfully')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }
}

class _EventCard extends StatelessWidget {
  final dynamic event;
  final bool isFirst;
  final bool isLast;

  const _EventCard({
    required this.event,
    required this.isFirst,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM dd, yyyy - HH:mm');
    
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timeline indicator
          Column(
            children: [
              if (!isFirst)
                Expanded(
                  child: Container(
                    width: 2,
                    color: Colors.grey[300],
                  ),
                ),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getEventColor(event.eventType),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  _getEventIcon(event.eventType),
                  color: Colors.white,
                  size: 20,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: Colors.grey[300],
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          // Event card
          Expanded(
            child: Card(
              margin: const EdgeInsets.only(bottom: 16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            event.eventType.displayName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue[50],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            event.actorType.displayName,
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue[800],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.person, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          event.actorName,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          dateFormat.format(event.timestamp),
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    if (event.eventData.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const Divider(),
                      const SizedBox(height: 8),
                      ...event.eventData.entries.map((entry) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${entry.key}: ',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 13,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  entry.value.toString(),
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.link, size: 12, color: Colors.grey[400]),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'Hash: ${event.currentEventHash.substring(0, 16)}...',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[500],
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getEventColor(dynamic eventType) {
    final type = eventType.toString();
    if (type.contains('MOVE_IN')) return Colors.green;
    if (type.contains('MOVE_OUT')) return Colors.orange;
    if (type.contains('RENT_PAID')) return Colors.blue;
    if (type.contains('RENT_DELAYED')) return Colors.red;
    if (type.contains('REPAIR')) return Colors.purple;
    if (type.contains('NOTICE')) return Colors.deepOrange;
    if (type.contains('COMPLAINT')) return Colors.redAccent;
    if (type.contains('INSPECTION')) return Colors.teal;
    return Colors.grey;
  }

  IconData _getEventIcon(dynamic eventType) {
    final type = eventType.toString();
    if (type.contains('MOVE_IN')) return Icons.login;
    if (type.contains('MOVE_OUT')) return Icons.logout;
    if (type.contains('RENT_PAID')) return Icons.payment;
    if (type.contains('RENT_DELAYED')) return Icons.warning;
    if (type.contains('REPAIR')) return Icons.build;
    if (type.contains('NOTICE')) return Icons.description;
    if (type.contains('COMPLAINT')) return Icons.report_problem;
    if (type.contains('INSPECTION')) return Icons.search;
    return Icons.event;
  }
}
