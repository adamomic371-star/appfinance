import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../services/transaction_service.dart';

class TransactionProvider extends ChangeNotifier {
  final TransactionService _service = TransactionService();
  List<TransactionModel> _transactions = [];
  bool _loading = false;
  String? _filterType;
  String? _filterCategory;
  String? _searchQuery;

  List<TransactionModel> get transactions => _filtered;
  List<TransactionModel> get all => _transactions;
  bool get loading => _loading;

  List<TransactionModel> get _filtered {
    var list = _transactions;
    if (_filterType != null) {
      list = list.where((t) => t.type == _filterType).toList();
    }
    if (_filterCategory != null) {
      list = list.where((t) => t.category == _filterCategory).toList();
    }
    if (_searchQuery != null && _searchQuery!.isNotEmpty) {
      final q = _searchQuery!.toLowerCase();
      list = list.where((t) =>
        t.note?.toLowerCase().contains(q) == true ||
        t.category.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  String? get filterType => _filterType;
  String? get filterCategory => _filterCategory;

  double get totalIncome => _transactions
      .where((t) => t.type == 'income')
      .fold(0, (sum, t) => sum + t.amount);

  double get totalExpenses => _transactions
      .where((t) => t.type == 'expense')
      .fold(0, (sum, t) => sum + t.amount);

  double get balance => totalIncome - totalExpenses;

  Future<void> load(String userId) async {
    _loading = true;
    notifyListeners();
    _transactions = await _service.getByUser(userId);
    _loading = false;
    notifyListeners();
  }

  Future<void> add(TransactionModel tx) async {
    final created = await _service.create(tx);
    _transactions.insert(0, created);
    notifyListeners();
  }

  Future<void> edit(TransactionModel tx) async {
    await _service.update(tx);
    final idx = _transactions.indexWhere((t) => t.id == tx.id);
    if (idx >= 0) _transactions[idx] = tx;
    notifyListeners();
  }

  Future<void> remove(String id) async {
    await _service.delete(id);
    _transactions.removeWhere((t) => t.id == id);
    notifyListeners();
  }

  Future<void> bulkDelete(List<String> ids) async {
    for (final id in ids) {
      await _service.delete(id);
    }
    _transactions.removeWhere((t) => ids.contains(t.id));
    notifyListeners();
  }

  void setFilterType(String? type) {
    _filterType = type;
    notifyListeners();
  }

  void setFilterCategory(String? category) {
    _filterCategory = category;
    notifyListeners();
  }

  void setSearchQuery(String? query) {
    _searchQuery = query;
    notifyListeners();
  }

  void clearFilters() {
    _filterType = null;
    _filterCategory = null;
    _searchQuery = null;
    notifyListeners();
  }

  List<TransactionModel> getByMonth(int month, int year) {
    return _transactions.where((t) =>
        t.date.month == month && t.date.year == year).toList()
      ..sort((a, b) => b.date.compareTo(a.date));
  }

  Map<String, double> getCategoryTotals(int month, int year, String type) {
    final map = <String, double>{};
    for (final tx in _transactions) {
      if (tx.type == type && tx.date.month == month && tx.date.year == year) {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
      }
    }
    return map;
  }
}
