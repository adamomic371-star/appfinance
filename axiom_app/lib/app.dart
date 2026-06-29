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
import 'src/models/transaction.dart';

class AxiomApp extends StatelessWidget {
  AxiomApp({super.key});

  final _router = GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final auth = context.read<AuthProvider>();
      final loggedIn = auth.isLoggedIn;
      final path = state.matchedLocation;
      final onAuthPage = path.startsWith('/login') ||
          path.startsWith('/register') || path.startsWith('/reset-password');

      if (!loggedIn && !onAuthPage) return '/login';
      if (loggedIn && onAuthPage) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/reset-password', builder: (_, __) => const ResetPasswordScreen()),
      GoRoute(
        path: '/transaction/new',
        builder: (_, __) => const TransactionFormScreen(),
      ),
      GoRoute(
        path: '/transaction/edit',
        builder: (_, state) => TransactionFormScreen(transaction: state.extra as TransactionModel?),
      ),
      ShellRoute(
        builder: (_, __, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, __) => const DashboardScreen()),
          GoRoute(path: '/transactions', builder: (_, __) => const TransactionListScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    return MaterialApp.router(
      title: 'Axiom',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: settings.themeMode,
      routerConfig: _router,
    );
  }
}
