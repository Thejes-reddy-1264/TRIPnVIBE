import 'package:flutter/material.dart';
import 'theme.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/planner_screen.dart';
import 'screens/booking_screen.dart';

void main() {
  runApp(const TripNVibeApp());
}

class TripNVibeApp extends StatelessWidget {
  const TripNVibeApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TRIPnVIBE',
      theme: AppTheme.darkTheme,
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/planner': (context) => const PlannerScreen(),
        '/bookings': (context) => const BookingScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}
