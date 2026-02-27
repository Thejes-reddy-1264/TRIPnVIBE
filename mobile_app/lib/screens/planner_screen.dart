import 'package:flutter/material.dart';
import '../theme.dart';

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({Key? key}) : super(key: key);

  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> {
  final List<String> _stops = [''];

  void _addStop() {
    setState(() {
      _stops.add('');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Planner'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.navigation, color: AppTheme.accentSolid),
                        SizedBox(width: 8),
                        Text('Define Your Route', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const Text('Trip Title', style: TextStyle(color: AppTheme.textSecondary)),
                    const SizedBox(height: 8),
                    TextFormField(
                      decoration: const InputDecoration(hintText: 'E.g., Summer Eurotrip 2026'),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Start Date', style: TextStyle(color: AppTheme.textSecondary)),
                              const SizedBox(height: 8),
                              TextFormField(
                                decoration: const InputDecoration(
                                  prefixIcon: Icon(Icons.calendar_today, size: 18, color: AppTheme.textSecondary),
                                  hintText: 'YYYY-MM-DD',
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('End Date', style: TextStyle(color: AppTheme.textSecondary)),
                              const SizedBox(height: 8),
                              TextFormField(
                                decoration: const InputDecoration(
                                  prefixIcon: Icon(Icons.calendar_today, size: 18, color: AppTheme.textSecondary),
                                  hintText: 'YYYY-MM-DD',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Stops & Destinations', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        TextButton.icon(
                          onPressed: _addStop,
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Add Stop'),
                          style: TextButton.styleFrom(foregroundColor: AppTheme.accentSolid),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ..._stops.asMap().entries.map((entry) {
                      int idx = entry.key;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: AppTheme.glassBackground,
                              child: Text('${idx + 1}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextFormField(
                                decoration: const InputDecoration(
                                  prefixIcon: Icon(Icons.location_on, size: 18, color: AppTheme.textSecondary),
                                  hintText: 'Search for a place',
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => Navigator.pushNamed(context, '/bookings'),
                      icon: const Icon(Icons.check),
                      label: const Text('Generate Route'),
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
