import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../domain/entities/rental.dart';
import '../../providers/rental_providers.dart';
import '../../widgets/empty_state.dart';
import '../rentals/my_rentals_screen.dart'; // Reuse _RentalCard if possible, or duplicate/refactor

class RentalsListScreen extends ConsumerStatefulWidget {
  const RentalsListScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<RentalsListScreen> createState() => _RentalsListScreenState();
}

class _RentalsListScreenState extends ConsumerState<RentalsListScreen> {
  String _statusFilter = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rentalsAsyncValue = ref.watch(myRentalsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rentals'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(70),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by address...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.grey[100],
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    ),
                    onChanged: (value) {
                      setState(() => _searchQuery = value);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _statusFilter,
                      icon: const Icon(Icons.filter_list),
                      items: const [
                        DropdownMenuItem(value: 'ALL', child: Text('All')),
                        DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                        DropdownMenuItem(value: 'CLOSED', child: Text('Closed')),
                      ],
                      onChanged: (value) {
                        setState(() => _statusFilter = value!);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: rentalsAsyncValue.when(
        data: (rentals) {
          final filtered = rentals.where((rental) {
            final matchesStatus = _statusFilter == 'ALL' ||
                rental.status.toString().split('.').last.toUpperCase() ==
                    _statusFilter;
            final matchesSearch = _searchQuery.isEmpty ||
                rental.propertyAddress
                    .toLowerCase()
                    .contains(_searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
          }).toList();

          if (filtered.isEmpty) {
            if (_searchQuery.isNotEmpty || _statusFilter != 'ALL') {
                 return const EmptyState(
                    icon: Icons.search_off,
                    title: 'No rentals found',
                    subtitle: 'Try adjusting your search or filters',
                  );
            }
            return const EmptyState(
              icon: Icons.home_work_outlined,
              title: 'No rentals yet',
              subtitle: 'Create a rental to get started',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: filtered.length,
            itemBuilder: (context, index) {
              return RentalListCard(
                rental: filtered[index],
                onTap: () => context.push('/rentals/${filtered[index].id}'),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/rentals/create'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class RentalListCard extends StatelessWidget {
  final Rental rental;
  final VoidCallback onTap;

  const RentalListCard({
    required this.rental,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      rental.propertyAddress,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _StatusBadge(status: rental.status),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.people, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${rental.participants.length} participants',
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.event, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${rental.eventCount} events',
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Started: ${DateFormat('MMM dd, yyyy').format(rental.startDate)}',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final RentalStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final isActive = status == RentalStatus.active;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isActive ? Colors.green[50] : Colors.grey[100],
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: isActive ? Colors.green[200]! : Colors.grey[300]!,
        ),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(
          color: isActive ? Colors.green[700] : Colors.grey[600],
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
