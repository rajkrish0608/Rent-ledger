import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../domain/entities/rental_event.dart';
import '../../providers/rental_providers.dart';
import '../../providers/media_provider.dart';
class AddEventScreen extends ConsumerStatefulWidget {
  final String rentalId;

  const AddEventScreen({
    Key? key,
    required this.rentalId,
  }) : super(key: key);

  @override
  ConsumerState<AddEventScreen> createState() => _AddEventScreenState();
}

class _AddEventScreenState extends ConsumerState<AddEventScreen> {
  final _formKey = GlobalKey<FormState>();
  EventType _selectedEventType = EventType.moveIn;
  ActorType _selectedActorType = ActorType.tenant;
  
  final _descriptionController = TextEditingController();
  final _notesController = TextEditingController();
  final _amountController = TextEditingController();
  
  final ImagePicker _picker = ImagePicker();
  final List<String> _attachmentKeys = [];
  final List<File> _localFiles = []; // For preview
  bool _isUploading = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    _notesController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final creationState = ref.watch(eventCreationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Event'),
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
                        'Event Type',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<EventType>(
                        value: _selectedEventType,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.category),
                        ),
                        items: EventType.values.map((type) {
                          return DropdownMenuItem(
                            value: type,
                            child: Row(
                              children: [
                                Icon(
                                  _getEventIcon(type),
                                  color: _getEventColor(type),
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(type.displayName),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedEventType = value!;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Actor Type',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<ActorType>(
                        value: _selectedActorType,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.person),
                        ),
                        items: ActorType.values.map((type) {
                          return DropdownMenuItem(
                            value: type,
                            child: Text(type.displayName),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedActorType = value!;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Event Details',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _descriptionController,
                        decoration: const InputDecoration(
                          labelText: 'Description*',
                          hintText: 'Brief description of the event',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.description),
                        ),
                        maxLines: 2,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter a description';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _notesController,
                        decoration: const InputDecoration(
                          labelText: 'Notes (Optional)',
                          hintText: 'Additional notes or context',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.note),
                        ),
                        maxLines: 4,
                      ),
                      if (_requiresAmount(_selectedEventType)) ...[
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _amountController,
                          decoration: const InputDecoration(
                            labelText: 'Amount',
                            hintText: '0.00',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.currency_rupee),
                          ),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          validator: (value) {
                            if (_requiresAmount(_selectedEventType)) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter an amount';
                              }
                              if (double.tryParse(value) == null) {
                                return 'Please enter a valid number';
                              }
                            }
                            return null;
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Evidence Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Evidence',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (_isUploading)
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_localFiles.isNotEmpty) ...[
                        SizedBox(
                          height: 100,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _localFiles.length,
                            separatorBuilder: (context, index) => const SizedBox(width: 8),
                            itemBuilder: (context, index) {
                              return Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.file(
                                      _localFiles[index],
                                      width: 100,
                                      height: 100,
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  Positioned(
                                    top: 4,
                                    right: 4,
                                    child: GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _localFiles.removeAt(index);
                                          _attachmentKeys.removeAt(index);
                                        });
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: Colors.black54,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.close,
                                          size: 16,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isUploading ? null : () => _pickImage(ImageSource.camera),
                              icon: const Icon(Icons.camera_alt),
                              label: const Text('Camera'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isUploading ? null : () => _pickImage(ImageSource.gallery),
                              icon: const Icon(Icons.photo_library),
                              label: const Text('Gallery'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.security, color: Colors.blue[800]),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'This event will be cryptographically linked to the timeline and cannot be modified or deleted.',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.blue[800],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const SizedBox(height: 24),
              creationState.when(
                data: (_) => ElevatedButton(
                  onPressed: _isUploading ? null : _submitEvent,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Add Event to Timeline',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
                loading: () => const ElevatedButton(
                  onPressed: null,
                  child: SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                error: (error, stack) => Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error, color: Colors.red),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Error: $error',
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _submitEvent,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text(
                        'Retry',
                        style: TextStyle(fontSize: 16),
                      ),
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

  Future<void> _submitEvent() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final eventData = <String, dynamic>{
      'description': _descriptionController.text.trim(),
    };
    
    if (_attachmentKeys.isNotEmpty) {
      eventData['attachments'] = _attachmentKeys;
    }

    if (_notesController.text.trim().isNotEmpty) {
      eventData['notes'] = _notesController.text.trim();
    }

    if (_requiresAmount(_selectedEventType) && _amountController.text.trim().isNotEmpty) {
      eventData['amount'] = double.parse(_amountController.text.trim());
    }

    await ref.read(eventCreationProvider.notifier).createEvent(
          rentalId: widget.rentalId,
          eventType: _selectedEventType,
          eventData: eventData,
          actorType: _selectedActorType,
        );

    // Check if successful
    final state = ref.read(eventCreationProvider);
    state.when(
      data: (_) {
        // Invalidate providers to refresh data
        ref.invalidate(rentalEventsProvider(widget.rentalId));
        ref.invalidate(rentalProvider(widget.rentalId));
        
        // Show success message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text('Event added to timeline successfully'),
                  ),
                ],
              ),
              backgroundColor: Colors.green,
            ),
          );
          
          // Navigate back
          context.pop();
        }
      },
      loading: () {},
      error: (error, stack) {
        // Error is already displayed in the UI
      },
    );
  }

  bool _requiresAmount(EventType eventType) {
    return eventType == EventType.rentPaid || 
           eventType == EventType.rentDelayed;
  }

  Color _getEventColor(EventType type) {
    switch (type) {
      case EventType.moveIn:
        return Colors.green;
      case EventType.moveOut:
        return Colors.orange;
      case EventType.rentPaid:
        return Colors.blue;
      case EventType.rentDelayed:
        return Colors.red;
      case EventType.repairRequest:
      case EventType.repairCompleted:
        return Colors.purple;
      case EventType.noticeIssued:
        return Colors.deepOrange;
      case EventType.complaint:
        return Colors.redAccent;
      case EventType.inspection:
        return Colors.teal;
    }
  }

  IconData _getEventIcon(EventType type) {
    switch (type) {
      case EventType.moveIn:
        return Icons.login;
      case EventType.moveOut:
        return Icons.logout;
      case EventType.rentPaid:
        return Icons.payment;
      case EventType.rentDelayed:
        return Icons.warning;
      case EventType.repairRequest:
        return Icons.build_circle;
      case EventType.repairCompleted:
        return Icons.check_circle;
      case EventType.noticeIssued:
        return Icons.description;
      case EventType.complaint:
        return Icons.report_problem;
      case EventType.inspection:
        return Icons.search;
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          _isUploading = true;
        });

        final file = File(pickedFile.path);
        final key = await ref.read(mediaUploadControllerProvider.notifier).uploadFile(file);

        if (key != null) {
          if (mounted) {
            setState(() {
              _localFiles.add(file);
              _attachmentKeys.add(key);
              _isUploading = false;
            });
          }
        } else {
          if (mounted) {
            setState(() {
              _isUploading = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Failed to upload image')),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking image: $e')),
        );
      }
    }
  }
}
