import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user.dart' as app;
import '../services/auth_service.dart';
import '../services/db_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _auth = AuthService();
  final FirebaseDbService _db = FirebaseDbService();

  app.UserModel? _user;
  bool _loading = true;
  String? _error;

  app.UserModel? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;
  String get userId => _user?.id ?? '';

  AuthProvider() {
    _auth.authState.listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(User? firebaseUser) async {
    if (firebaseUser == null) {
      _user = null;
      _loading = false;
      notifyListeners();
      return;
    }
    try {
      final data = await _db.get('users/${firebaseUser.uid}');
      if (data != null) {
        _user = app.UserModel.fromMap(firebaseUser.uid, data);
      } else {
        _user = app.UserModel(
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        );
      }
    } catch (e) {
      _user = app.UserModel(
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
      );
    }
    _loading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _auth.login(email, password);
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _mapAuthError(e);
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String email, String password, String name) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _auth.register(email, password, name);
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _mapAuthError(e);
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _auth.logout();
  }

  Future<bool> signInWithGoogle() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _auth.signInWithGoogle();
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _mapAuthError(e);
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resetPassword(String email) async {
    try {
      await _auth.resetPassword(email);
      return true;
    } catch (e) {
      _error = _mapAuthError(e);
      notifyListeners();
      return false;
    }
  }

  Future<void> updateProfile({String? name, String? currency, String? theme}) async {
    if (name != null) _user = _user?.copyWith(name: name);
    if (currency != null) _user = _user?.copyWith(currency: currency);
    if (theme != null) _user = _user?.copyWith(theme: theme);
    if (_user != null) {
      await _db.set('users/${_user!.id}', _user!.toMap());
    }
    notifyListeners();
  }

  String _mapAuthError(Object e) {
    if (e is! FirebaseAuthException) return 'Errore di rete o server';
    final code = e.code;
    switch (code) {
      case 'user-not-found': return 'Utente non trovato';
      case 'wrong-password': return 'Password errata';
      case 'invalid-email': return 'Email non valida';
      case 'email-already-in-use': return 'Email già registrata';
      case 'weak-password': return 'Password troppo debole';
      case 'invalid-credential': return 'Credenziali non valide';
      case 'too-many-requests': return 'Troppi tentativi, riprova più tardi';
      default: return 'Errore: ${e.toString()}';
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
