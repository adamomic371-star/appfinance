import 'dart:convert';
import 'package:firebase_database/firebase_database.dart';
import 'package:uuid/uuid.dart';
import '../models/transaction.dart';
import 'db_service.dart';

class TransactionService {
  final FirebaseDbService _db = FirebaseDbService();
  final _uuid = const Uuid();

  String get _basePath => 'transactions';

  static String _dateRangeStart(int month, int year) =>
      DateTime(year, month, 1).toIso8601String();

  static String _dateRangeEnd(int month, int year) {
    if (month == 12) {
      return DateTime(year + 1, 1, 1).toIso8601String();
    }
    return DateTime(year, month + 1, 1).toIso8601String();
  }

  Future<TransactionModel> create(TransactionModel tx) async {
    final id = _uuid.v4();
    final data = tx.toMap();
    data['id'] = id;
    await _db.set('/', data);
    return tx.copyWith(id: id);
  }

  Future<void> update(TransactionModel tx) async {
    await _db.update('/', tx.toMap());
  }

  Future<void> delete(String id) async {
    await _db.delete('/');
  }

  Future<List<TransactionModel>> getByUser(String userId) async {
    final snapshot = await FirebaseDatabase.instance.ref(_basePath)
        .orderByChild('date')
        .get();
    if (!snapshot.exists) return [];
    return _parseList(snapshot, userId);
  }

  Future<List<TransactionModel>> getByUserAndMonth(String userId, int month, int year) async {
    final startDate = _dateRangeStart(month, year);
    final endDate = _dateRangeEnd(month, year);

    final snapshot = await FirebaseDatabase.instance.ref(_basePath)
        .orderByChild('date')
        .startAt(startDate)
        .endAt(endDate)
        .get();
    if (!snapshot.exists) return [];
    return _parseList(snapshot, userId);
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

  List<TransactionModel> _parseList(DataSnapshot snapshot, String userId) {
    final map = snapshot.value as Map<dynamic, dynamic>?;
    if (map == null) return [];
    return map.entries
        .where((e) => e.value['userId'] == userId)
        .map((e) {
      final data = Map<String, dynamic>.from(e.value as Map);
      return TransactionModel.fromMap(e.key.toString(), data);
    }).toList();
  }
}
