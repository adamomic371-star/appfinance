import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'src/config/firebase_config.dart';
import 'src/providers/auth_provider.dart';
import 'src/providers/transaction_provider.dart';
import 'src/providers/account_provider.dart';
import 'src/providers/category_provider.dart';
import 'src/providers/budget_provider.dart';
import 'src/providers/settings_provider.dart';
import 'src/providers/detected_transaction_provider.dart';
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
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  await FirebaseConfig.initialize();
  runApp(const AxiomAppProvider());
}

class AxiomAppProvider extends StatelessWidget {
  const AxiomAppProvider({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthProvider();
    final router = GoRouter(
      initialLocation: '/login',
      refreshListenable: auth,
      redirect: (context, state) {
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
            GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
            GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          ],
        ),
      ],
    );

    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider(create: (_) => TransactionProvider()),
        ChangeNotifierProvider(create: (_) => AccountProvider()),
        ChangeNotifierProvider(create: (_) => CategoryProvider()),
        ChangeNotifierProvider(create: (_) => BudgetProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()..load()),
        ChangeNotifierProvider(create: (_) => DetectedTransactionProvider()),
      ],
      child: AxiomApp(router: router),
    );
  }
}
