import 'package:firebase_core/firebase_core.dart';

class FirebaseConfig {
  static const FirebaseOptions options = FirebaseOptions(
    apiKey: 'AIzaSyCMPawrAL5tT_bH6YEcNe_UEEyIwLIgHIQ',
    appId: '1:181987533980:web:41c5032990ccede17eb959',
    messagingSenderId: '181987533980',
    projectId: 'financeapp-556ae',
    authDomain: 'financeapp-556ae.firebaseapp.com',
    databaseURL: 'https://financeapp-556ae-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: 'financeapp-556ae.firebasestorage.app',
  );

  static Future<void> initialize() async {
    await Firebase.initializeApp(options: options);
  }
}
