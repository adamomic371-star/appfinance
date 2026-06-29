import 'dart:convert';
import 'package:firebase_database/firebase_database.dart';
import 'package:uuid/uuid.dart';
import '../models/transaction.dart';
import 'db_service.dart';

class TransactionService {
  final FirebaseDbService _db = FirebaseDbService();
  final _uuid = const Uuid();

  String get _basePath => 'transactions';

  Future<TransactionModel> create(TransactionModel tx) async {
    final id = _uuid.v4();
    final data = tx.toMap();
    data['id'] = id;
    await _db.set('$_basePath/$id', data);
    return tx.copyWith(id: id);
  }

  Future<void> update(TransactionModel tx) async {
    await _db.update('$_basePath/${tx.id}', tx.toMap());
  }

  Future<void> delete(String id) async {
    await _db.delete('$_basePath/$id');
  }

  Future<List<TransactionModel>> getByUser(String userId) async {
    final snapshot = await FirebaseDatabase.instance.ref(_basePath)
        .orderByChild('userId')
        .equalTo(userId)
        .get();
    if (!snapshot.exists) return [];
    return _parseList(snapshot);
  }

  Future<List<TransactionModel>> getByUserAndMonth(String userId, int month, int year) async {
    final all = await getByUser(userId);
    return all.where((tx) =>
        tx.date.month == month && tx.date.year == year).toList()
      ..sort((a, b) => b.date.compareTo(a.date));
  }

  Future<List<TransactionModel>> getByUserAndAccount(String userId, String accountId) async {
    final all = await getByUser(userId);
    return all.where((tx) => tx.accountId == accountId).toList();
  }

  Stream<List<TransactionModel>> streamByUser(String userId) {
    return _db.onChildAdded(_basePath).map((event) {
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      return TransactionModel.fromMap(event.snapshot.key!, data);
    }).map((tx) => [tx]);
  }

  List<TransactionModel> _parseList(DataSnapshot snapshot) {
    final map = snapshot.value as Map<dynamic, dynamic>?;
    if (map == null) return [];
    return map.entries.map((e) {
      final data = Map<String, dynamic>.from(e.value as Map);
      return TransactionModel.fromMap(e.key.toString(), data);
    }).toList()..sort((a, b) => b.date.compareTo(a.date));
  }
}
