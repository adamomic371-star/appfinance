import 'package:flutter/material.dart';
import '../models/account.dart';
import '../services/db_service.dart';
import 'package:uuid/uuid.dart';

class AccountProvider extends ChangeNotifier {
  final FirebaseDbService _db = FirebaseDbService();
  final _uuid = const Uuid();

  List<AccountModel> _accounts = [];
  bool _loading = false;

  List<AccountModel> get accounts => _accounts;
  bool get loading => _loading;
  double get totalBalance => _accounts.fold(0, (sum, a) => sum + a.balance);

  Future<void> load(String userId) async {
    _loading = true;
    notifyListeners();
    final data = await _db.getAll('accounts');
    _accounts = data
        .where((d) => d['userId'] == userId)
        .map((d) => AccountModel.fromMap(d['id'], d))
        .toList();
    _loading = false;
    notifyListeners();
  }

  Future<void> add(AccountModel account) async {
    final id = _uuid.v4();
    final data = account.toMap();
    data['id'] = id;
    await _db.set('accounts/$id', data);
    _accounts.add(account.copyWith(
      name: account.name,
      type: account.type,
      balance: account.balance,
    ));
    notifyListeners();
  }

  Future<void> update(AccountModel account) async {
    await _db.update('accounts/${account.id}', account.toMap());
    final idx = _accounts.indexWhere((a) => a.id == account.id);
    if (idx >= 0) _accounts[idx] = account;
    notifyListeners();
  }

  Future<void> delete(String id) async {
    await _db.delete('accounts/$id');
    _accounts.removeWhere((a) => a.id == id);
    notifyListeners();
  }

  Future<void> setMainAccount(String id) async {
    for (final a in _accounts) {
      if (a.isMain && a.id != id) {
        await _db.update('accounts/${a.id}', {'isMain': false});
      }
    }
    await _db.update('accounts/$id', {'isMain': true});
    _accounts = _accounts.map((a) => a.copyWith(
      isMain: a.id == id,
    )).toList();
    notifyListeners();
  }

  void updateBalance(String accountId, double delta) {
    final idx = _accounts.indexWhere((a) => a.id == accountId);
    if (idx >= 0) {
      final a = _accounts[idx];
      _accounts[idx] = a.copyWith(balance: a.balance + delta);
      _db.update('accounts/$accountId', {'balance': _accounts[idx].balance});
      notifyListeners();
    }
  }
}
