import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../domain/entities/rental.dart';
import '../../providers/providers.dart';
import '../../widgets/empty_state.dart';

class SocietyDashboardScreen extends ConsumerWidget {
  const SocietyDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final societyRentalsAsync = ref.watch(societyRentalsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Society Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => context.go('/account'),
          ),
        ],
      ),
      // drawer: const SocietyNavigationDrawer(), // To be implemented
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(societyRentalsProvider);
        },
        child: societyRentalsAsync.when(
          data: (rentals) {
            if (rentals.isEmpty) {
              return const EmptyState(
                icon: Icons.apartment,
                title: 'No Active Rentals Found',
                subtitle: 'Rentals in your society will appear here',
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: rentals.length,
              itemBuilder: (context, index) {
                return _SocietyRentalCard(
                  rental: rentals[index],
                  onTap: () => context.push('/rentals/${rentals[index].id}'),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }
}

class _SocietyRentalCard extends StatelessWidget {
  final Rental rental;
  final VoidCallback onTap;

  const _SocietyRentalCard({
    required this.rental,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Assuming property address contains unit number or is formatted "Building - Unit"
    // We can try to parse it or just display as is.
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.home, color: Colors.blue),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rental.propertyAddress,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tenant: ${_getTenantName(rental)}', // Helper to extract tenant
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              _StatusChip(status: rental.status),
            ],
          ),
        ),
      ),
    );
  }

  String _getTenantName(Rental rental) {
    final tenant = rental.participants.firstWhere(
      (p) => p.role == Role.tenant,
      orElse: () => RentalParticipant(
          id: '', name: 'Unknown', role: Role.tenant, email: '', phone: ''),
    );
    return tenant.name;
  }
}

class _StatusChip extends StatelessWidget {
  final RentalStatus status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case RentalStatus.active:
        color = Colors.green;
        break;
      case RentalStatus.closed:
        color = Colors.grey;
        break;
      default:
        color = Colors.blue;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
