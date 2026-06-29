import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DatabaseReference _db = FirebaseDatabase.instance.ref();
  final GoogleSignIn _googleSignIn = GoogleSignIn();

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

  Future<UserCredential> signInWithGoogle() async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) throw Exception('Google sign-in annullato');
    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    final userCred = await _auth.signInWithCredential(credential);
    if (userCred.additionalUserInfo?.isNewUser == true) {
      await _db.child('users/${userCred.user!.uid}').set({
        'id': userCred.user!.uid,
        'email': userCred.user!.email,
        'name': userCred.user!.displayName ?? 'Utente Google',
        'photoUrl': userCred.user!.photoURL,
        'plan': 'Free',
        'currency': 'EUR',
        'theme': 'dark',
        'createdAt': DateTime.now().toIso8601String(),
      });
    }
    return userCred;
  }

  Future<void> logout() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

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
