import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'src/config/firebase_config.dart';
import 'src/providers/auth_provider.dart';
import 'src/providers/transaction_provider.dart';
import 'src/providers/account_provider.dart';
import 'src/providers/category_provider.dart';
import 'src/providers/budget_provider.dart';
import 'src/providers/settings_provider.dart';
import 'src/providers/detected_transaction_provider.dart';
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
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => TransactionProvider()),
        ChangeNotifierProvider(create: (_) => AccountProvider()),
        ChangeNotifierProvider(create: (_) => CategoryProvider()),
        ChangeNotifierProvider(create: (_) => BudgetProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()..load()),
        ChangeNotifierProvider(create: (_) => DetectedTransactionProvider()),
      ],
      child: AxiomApp(),
    );
  }
}
