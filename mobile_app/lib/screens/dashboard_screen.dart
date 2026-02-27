import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme.dart';
import '../api/api_client.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;
  List<dynamic> _trips = [];
  String _errorMsg = '';

  @override
  void initState() {
    super.initState();
    _fetchTrips();
  }

  Future<void> _fetchTrips() async {
    try {
      final res = await ApiClient.get('/trips/');
      
      if (res.statusCode == 200) {
        if (mounted) {
           setState(() {
             _trips = jsonDecode(res.body);
             _isLoading = false;
           });
        }
      } else if (res.statusCode == 401) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('token');
        if (mounted) Navigator.pushReplacementNamed(context, '/');
      } else {
         if (mounted) setState(() { _errorMsg = 'Failed to load trips'; _isLoading = false; });
      }
    } catch (e) {
       if (mounted) setState(() { _errorMsg = 'Network Error'; _isLoading = false; });
    }
  }

  Future<void> _logout() async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TRIPnVIBE'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _logout(),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Welcome back,',
              style: TextStyle(fontSize: 28, color: AppTheme.textPrimary, fontFamily: 'Outfit'),
            ),
            const Text(
              'Traveler',
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppTheme.accentSolid, fontFamily: 'Outfit'),
            ),
            const SizedBox(height: 8),
            const Text(
              'Where are we heading next?',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/planner'),
              icon: const Icon(Icons.add),
              label: const Text('Plan a New Trip'),
            ),
            const SizedBox(height: 48),
            const Text(
              'Your Upcoming Trips',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator())
                : _errorMsg.isNotEmpty
                  ? Center(child: Text(_errorMsg, style: const TextStyle(color: AppTheme.accentSolid)))
                  : _trips.isEmpty
                    ? Card(
                        color: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          side: const BorderSide(color: AppTheme.borderColor, style: BorderStyle.solid),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const CircleAvatar(
                                radius: 32,
                                backgroundColor: AppTheme.glassBackground,
                                child: Icon(Icons.explore, size: 32, color: AppTheme.textSecondary),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'No upcoming trips',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                "It's time to start planning your next adventure.",
                                textAlign: TextAlign.center,
                                style: TextStyle(color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        itemCount: _trips.length,
                        itemBuilder: (context, index) {
                          final trip = _trips[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              title: Text(trip['title'] ?? 'Trip', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                              subtitle: Text('${trip['start_date']} to ${trip['end_date']}'),
                              trailing: Chip(
                                label: Text(trip['status'], style: const TextStyle(color: AppTheme.accentSolid, fontSize: 12)),
                                backgroundColor: AppTheme.accentSolid.withOpacity(0.1),
                                side: BorderSide.none,
                              ),
                              onTap: () => Navigator.pushNamed(context, '/planner'),
                            ),
                          );
                        },
                      ),
            ),
          ],
        ),
      ),
    );
  }
}
