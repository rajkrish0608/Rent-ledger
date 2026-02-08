import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/rental_providers.dart';

class AddRentalScreen extends ConsumerStatefulWidget {
  const AddRentalScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<AddRentalScreen> createState() => _AddRentalScreenState();
}

class _AddRentalScreenState extends ConsumerState<AddRentalScreen> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _unitController = TextEditingController();
  DateTime _startDate = DateTime.now();

  @override
  void dispose() {
    _addressController.dispose();
    _unitController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    if (picked != null && picked != _startDate) {
      setState(() {
        _startDate = picked;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final rental = await ref.read(rentalCreationProvider.notifier).createRental(
          propertyAddress: _addressController.text.trim(),
          propertyUnit: _unitController.text.trim().isEmpty ? null : _unitController.text.trim(),
          startDate: _startDate,
        );

    if (rental != null) {
      // Refresh rentals list
      ref.invalidate(myRentalsProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Rental created successfully')),
        );
        context.go('/rentals/${rental.id}');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final creationState = ref.watch(rentalCreationProvider);
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create New Rental'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Property Details',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _addressController,
                        decoration: const InputDecoration(
                          labelText: 'Property Address*',
                          hintText: 'Enter full address',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.location_on),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter the property address';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _unitController,
                        decoration: const InputDecoration(
                          labelText: 'Unit / Flat Number (Optional)',
                          hintText: 'e.g. B-204',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.apartment),
                        ),
                      ),
                      const SizedBox(height: 16),
                      InkWell(
                        onTap: () => _selectDate(context),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Start Date*',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.calendar_today),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(dateFormat.format(_startDate)),
                              const Icon(Icons.arrow_drop_down),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              creationState.when(
                data: (_) => ElevatedButton(
                  onPressed: _submitForm,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Create Rental Timeline',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => Column(
                  children: [
                    Text(
                      'Error: $error',
                      style: const TextStyle(color: Colors.red),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _submitForm,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
