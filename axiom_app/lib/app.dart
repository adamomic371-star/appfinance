import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'src/config/theme.dart';
import 'src/providers/auth_provider.dart';
import 'src/providers/transaction_provider.dart';
import 'src/providers/account_provider.dart';
import 'src/providers/category_provider.dart';
import 'src/providers/budget_provider.dart';
import 'src/providers/settings_provider.dart';
import 'src/screens/auth/login_screen.dart';
import 'src/screens/auth/register_screen.dart';
import 'src/screens/auth/reset_password_screen.dart';
import 'src/screens/home/home_shell.dart';
import 'src/screens/home/dashboard_screen.dart';
import 'src/screens/transactions/transaction_list_screen.dart';
import 'src/screens/transactions/transaction_form_screen.dart';
import 'src/screens/profile/profile_screen.dart';
import 'src/screens/notifications/notifications_screen.dart';
import 'src/models/transaction.dart';

class AxiomApp extends StatelessWidget {
  final GoRouter router;
  const AxiomApp({super.key, required this.router});

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    return MaterialApp.router(
      title: 'Axiom',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: settings.themeMode,
      routerConfig: router,
    );
  }
}
