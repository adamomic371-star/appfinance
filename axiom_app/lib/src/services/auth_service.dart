import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DatabaseReference _db = FirebaseDatabase.instance.ref();

  Stream<User?> get authState => _auth.authStateChanges();
  User? get currentUser => _auth.currentUser;

  Future<UserCredential> login(String email, String password) {
    return _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<UserCredential> register(String email, String password, String name) async {
    final cred = await _auth.createUserWithEmailAndPassword(email: email, password: password);
    await cred.user?.updateDisplayName(name);
    await _db.child('users/${cred.user!.uid}').set({
      'id': cred.user!.uid,
      'email': email,
      'name': name,
      'plan': 'Free',
      'currency': 'EUR',
      'theme': 'dark',
      'createdAt': DateTime.now().toIso8601String(),
    });
    return cred;
  }

  Future<void> logout() => _auth.signOut();

  Future<void> resetPassword(String email) {
    return _auth.sendPasswordResetEmail(email: email);
  }

  Future<void> updateProfile({String? name, String? photoUrl}) async {
    if (name != null) await currentUser?.updateDisplayName(name);
    if (photoUrl != null) await currentUser?.updatePhotoURL(photoUrl);
  }

  Future<void> changePassword(String newPassword) {
    return currentUser!.updatePassword(newPassword);
  }
}
