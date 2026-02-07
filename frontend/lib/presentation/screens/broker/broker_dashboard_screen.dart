import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../data/models/dashboard/dashboard_stats.dart';
import '../../../data/models/rental_event_model.dart';
import '../../../domain/entities/rental_event.dart';
import '../../providers/providers.dart';
import '../../widgets/empty_state.dart';

class BrokerDashboardScreen extends ConsumerWidget {
  const BrokerDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsyncValue = ref.watch(brokerStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => context.go('/account'), 
          ),
        ],
      ),
      // drawer: const BrokerNavigationDrawer(), // To be implemented
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(brokerStatsProvider);
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Overview',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              statsAsyncValue.when(
                data: (stats) => _StatsGrid(stats: stats),
                loading: () => const SizedBox(
                  height: 200,
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (err, stack) => SizedBox(
                  height: 200,
                  child: Center(child: Text('Error: ${err.toString()}')),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Activity',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  TextButton(
                    onPressed: () => context.go('/rentals'),
                    child: const Text('View All Rentals'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              statsAsyncValue.when(
                data: (stats) => _RecentActivityList(
                  activities: stats.recentActivity.map((e) => e.toEntity()).toList(),
                ),
                loading: () => const SizedBox.shrink(),
                error: (err, stack) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/rentals/create'),
        icon: const Icon(Icons.add),
        label: const Text('Create Rental'),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final DashboardStats stats;

  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    // Determine cross axis count based on width or just stick to 2
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: [
        _StatCard(
          title: 'Active Rentals',
          value: stats.activeRentals.toString(),
          icon: Icons.home,
          color: Colors.blue,
        ),
        _StatCard(
          title: 'Closed Rentals',
          value: stats.closedRentals.toString(),
          icon: Icons.check_circle,
          color: Colors.green,
        ),
        _StatCard(
          title: 'Pending Move-outs',
          value: stats.pendingMoveOuts.toString(),
          icon: Icons.warning,
          color: Colors.orange,
        ),
        _StatCard(
          title: 'Total Managed',
          value: (stats.activeRentals + stats.closedRentals).toString(),
          icon: Icons.analytics, // Or business
          color: Colors.purple,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 28),
              ],
            ),
             const Spacer(),
            Text(
              value,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentActivityList extends StatelessWidget {
  final List<RentalEvent> activities;

  const _RecentActivityList({required this.activities});

  @override
  Widget build(BuildContext context) {
    if (activities.isEmpty) {
      return const EmptyState(
        icon: Icons.history,
        title: 'No recent activity',
        subtitle: 'Events like rent payments will appear here',
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: activities.length,
      itemBuilder: (context, index) {
        final event = activities[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.blue.withOpacity(0.1),
              child: Icon(_getIconForEventType(event.eventType), color: Colors.blue, size: 20),
            ),
            title: Text(
              _formatEventType(event.eventType),
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            subtitle: Text(
              '${event.actorName} • ${DateFormat.yMMMd().format(event.timestamp)}',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            trailing: const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
            onTap: () => context.go('/rentals/${event.rentalId}'),
          ),
        );
      },
    );
  }

  IconData _getIconForEventType(EventType type) {
    switch (type) {
      case EventType.rentPaid:
        return Icons.attach_money;
      case EventType.moveIn:
        return Icons.login;
      case EventType.moveOut:
        return Icons.logout;
      case EventType.maintenance:
        return Icons.build;
      case EventType.disputeFlagged:
        return Icons.flag;
      default:
        return Icons.event;
    }
  }

  String _formatEventType(EventType type) {
     return type.toString().split('.').last.replaceAllMapped(
        RegExp(r'([A-Z])'), (match) => ' ${match.group(0)}').trim().capitalize();
  }
}

extension StringExtension on String {
    String capitalize() {
      return "${this[0].toUpperCase()}${this.substring(1)}";
    }
}
