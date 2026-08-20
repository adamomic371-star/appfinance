import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../services/transaction_service.dart';
import '../services/wallet_transaction_service.dart';

class TransactionProvider extends ChangeNotifier {
  final TransactionService _service = TransactionService();
  final WalletTransactionService _walletService = WalletTransactionService();
  List<TransactionModel> _transactions = [];
  bool _loading = false;
  String? _filterType;
  String? _filterCategory;
  String? _searchQuery;

  // Cached fields
  double _totalIncome = 0.0;
  double _totalExpenses = 0.0;
  double _balance = 0.0;

  // Cached filtered result
  List<TransactionModel> _cachedFiltered = [];
  String? _lastFilterType;
  String? _lastFilterCategory;
  String? _lastSearchQuery;

  List<TransactionModel> get transactions => _filtered;
  List<TransactionModel> get all => _transactions;
  bool get loading => _loading;

  List<TransactionModel> get _filtered {
    // Check if filters match cached values
    if (_filterType == _lastFilterType &&
        _filterCategory == _lastFilterCategory &&
        _searchQuery == _lastSearchQuery) {
      // Return cached result
      return _cachedFiltered;
    }

    // Recompute and cache the result
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

    // Sort by date descending
    list = list..sort((a, b) => b.date.compareTo(a.date));

    // Update cache
    _cachedFiltered = list;
    _lastFilterType = _filterType;
    _lastFilterCategory = _filterCategory;
    _lastSearchQuery = _searchQuery;

    return list;
  }

  String? get filterType => _filterType;
  String? get filterCategory => _filterCategory;

  // Updated getters using cached values
  double get totalIncome => _totalIncome;

  double get totalExpenses => _totalExpenses;

  double get balance => _balance;

  void _recalculateTotals() {
    _totalIncome = _transactions
        .where((t) => t.type == 'income')
        .fold(0, (sum, t) => sum + t.amount);
    _totalExpenses = _transactions
        .where((t) => t.type == 'expense')
        .fold(0, (sum, t) => sum + t.amount);
    _balance = _totalIncome - _totalExpenses;
  }

  Future<void> load(String userId) async {
    _loading = true;
    notifyListeners();
    _transactions = await _service.getByUser(userId);
    _recalculateTotals();
    _loading = false;
    notifyListeners();
  }

  Future<void> add(TransactionModel tx) async {
    final created = await _service.create(tx);
    _transactions.insert(0, created);
    _recalculateTotals();
    notifyListeners();
  }

  Future<void> edit(TransactionModel tx) async {
    await _service.update(tx);
    final idx = _transactions.indexWhere((t) => t.id == tx.id);
    if (idx >= 0) _transactions[idx] = tx;
    _recalculateTotals();
    notifyListeners();
  }

  Future<void> remove(String id) async {
    await _service.delete(id);
    _transactions.removeWhere((t) => t.id == id);
    _recalculateTotals();
    notifyListeners();
  }

  Future<void> bulkDelete(List<String> ids) async {
    for (final id in ids) {
      await _service.delete(id);
    }
    _transactions.removeWhere((t) => ids.contains(t.id));
    _recalculateTotals();
    notifyListeners();
  }

  void setFilterType(String? type) {
    // Only update if value changed
    if (_filterType == type) return;
    _filterType = type;
    // Invalidate cache since filter changed
    _lastFilterType = null;
    notifyListeners();
  }

  void setFilterCategory(String? category) {
    // Only update if value changed
    if (_filterCategory == category) return;
    _filterCategory = category;
    // Invalidate cache since filter changed
    _lastFilterCategory = null;
    notifyListeners();
  }

  void setSearchQuery(String? query) {
    // Only update if value changed
    if (_searchQuery == query) return;
    _searchQuery = query;
    // Invalidate cache since search changed
    _lastSearchQuery = null;
    notifyListeners();
  }

  void clearFilters() {
    _filterType = null;
    _filterCategory = null;
    _searchQuery = null;
    // Reset cache tracking
    _lastFilterType = null;
    _lastFilterCategory = null;
    _lastSearchQuery = null;
    _cachedFiltered = [];
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

  /// Sync a Google Wallet payment as a transaction
  Future<void> syncFromGoogleWalletPayment({
    required PaymentData paymentData,
    required String userId,
    required String category,
    String type = 'expense',
  }) async {
    // Check for duplicate - see if transaction already exists
    final existing = _transactions.firstWhere(
      (t) => t.receiptUrl == paymentData.transactionId,
      orElse: () => TransactionModel(
        id: '',
        userId: '',
        amount: 0,
        type: 'expense',
        category: '',
        date: DateTime.now(),
      ),
    );

    if (existing.id.isNotEmpty && existing.id != '') {
      // Already synced, do nothing
      return;
    }

    // Create transaction from payment data
    final tx = await _walletService.savePaymentResult(
      paymentData: paymentData,
      userId: userId,
      category: category,
      type: type,
    );

    // Add to transactions list at position 0 (newest first)
    _transactions.insert(0, tx);
    _recalculateTotals();
    notifyListeners();
  }
}