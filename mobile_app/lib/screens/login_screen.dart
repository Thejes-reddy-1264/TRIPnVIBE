import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme.dart';
import '../api/api_client.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLogin = true;
  bool _isLoading = false;
  String _errorMsg = '';
  
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();

  Future<void> _submit() async {
    setState(() {
      _isLoading = true;
      _errorMsg = '';
    });

    try {
      if (_isLogin) {
        final res = await ApiClient.postFormData('/login/access-token', {
          'username': _emailController.text.trim(),
          'password': _passwordController.text,
        });

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('token', data['access_token']);
          if (!mounted) return;
          Navigator.pushReplacementNamed(context, '/dashboard');
        } else {
          setState(() => _errorMsg = 'Invalid credentials');
        }
      } else {
        final res = await ApiClient.post('/users/', {
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
          'full_name': _nameController.text.trim(),
        });
        
        if (res.statusCode == 200) {
           final loginRes = await ApiClient.postFormData('/login/access-token', {
            'username': _emailController.text.trim(),
            'password': _passwordController.text,
          });
          if (loginRes.statusCode == 200) {
             final data = jsonDecode(loginRes.body);
             final prefs = await SharedPreferences.getInstance();
             await prefs.setString('token', data['access_token']);
             if (!mounted) return;
             Navigator.pushReplacementNamed(context, '/dashboard');
          }
        } else {
           setState(() => _errorMsg = 'Registration failed');
        }
      }
    } catch (e) {
      setState(() => _errorMsg = 'Network Error');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.location_on,
                size: 64,
                color: AppTheme.accentSolid,
              ),
              const SizedBox(height: 16),
              const Text(
                'TRIPnVIBE',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Outfit',
                  color: AppTheme.textPrimary,
                ),
              ),
              const Text(
                'Welcome to the future of travel.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 48),
              if (_errorMsg.isNotEmpty)
                 Container(
                   padding: const EdgeInsets.all(12),
                   margin: const EdgeInsets.only(bottom: 16),
                   decoration: BoxDecoration(
                     color: AppTheme.accentSolid.withOpacity(0.1),
                     borderRadius: BorderRadius.circular(8)
                   ),
                   child: Text(_errorMsg, style: const TextStyle(color: AppTheme.accentSolid), textAlign: TextAlign.center),
                 ),
              if (!_isLogin) ...[
                const Text('Full Name', style: TextStyle(color: AppTheme.textSecondary)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.person_outline, color: AppTheme.textSecondary),
                    hintText: 'John Doe',
                  ),
                ),
                const SizedBox(height: 16),
              ],
              const Text('Email Address', style: TextStyle(color: AppTheme.textSecondary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.email_outlined, color: AppTheme.textSecondary),
                  hintText: 'you@example.com',
                ),
              ),
              const SizedBox(height: 16),
              const Text('Password', style: TextStyle(color: AppTheme.textSecondary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.lock_outline, color: AppTheme.textSecondary),
                  hintText: '••••••••',
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Text(_isLogin ? 'Sign In' : 'Create Account'),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _isLogin ? "Don't have an account? " : "Already have an account? ",
                    style: const TextStyle(color: AppTheme.textSecondary),
                  ),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _isLogin = !_isLogin;
                      });
                    },
                    child: Text(
                      _isLogin ? 'Sign up' : 'Log in',
                      style: const TextStyle(
                        color: AppTheme.accentSolid,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
