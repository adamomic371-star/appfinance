import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/budget.dart';
import '../services/db_service.dart';

class BudgetProvider extends ChangeNotifier {
  final FirebaseDbService _db = FirebaseDbService();
  final _uuid = const Uuid();

  List<BudgetModel> _budgets = [];

  List<BudgetModel> get budgets => _budgets;

  List<BudgetModel> getForMonth(int month, int year) {
    return _budgets.where((b) => b.month == month && b.year == year).toList();
  }

  BudgetModel? getForCategory(String category, int month, int year) {
    try {
      return _budgets.firstWhere((b) =>
          b.category == category && b.month == month && b.year == year);
    } catch (_) {
      return null;
    }
  }

  Future<void> load(String userId) async {
    final data = await _db.getAll('budgets');
    _budgets = data
        .where((d) => d['userId'] == userId)
        .map((d) => BudgetModel.fromMap(d['id'], d))
        .toList();
    notifyListeners();
  }

  Future<void> save(BudgetModel budget) async {
    final existing = _budgets.where((b) =>
        b.category == budget.category && b.month == budget.month && b.year == budget.year).toList();
    if (existing.isNotEmpty) {
      await _db.update('budgets/${existing.first.id}', budget.toMap());
      final idx = _budgets.indexWhere((b) => b.id == existing.first.id);
      if (idx >= 0) _budgets[idx] = budget;
    } else {
      final id = _uuid.v4();
      final data = budget.toMap();
      data['id'] = id;
      await _db.set('budgets/$id', data);
      _budgets.add(BudgetModel(
        id: id,
        userId: budget.userId,
        category: budget.category,
        limit: budget.limit,
        month: budget.month,
        year: budget.year,
      ));
    }
    notifyListeners();
  }

  Future<void> delete(String id) async {
    await _db.delete('budgets/$id');
    _budgets.removeWhere((b) => b.id == id);
    notifyListeners();
  }

  void updateSpending(String category, double amount, int month, int year) {
    final idx = _budgets.indexWhere((b) =>
        b.category == category && b.month == month && b.year == year);
    if (idx >= 0) {
      _budgets[idx] = _budgets[idx].copyWith(spent: _budgets[idx].spent + amount);
      _db.update('budgets/${_budgets[idx].id}', {'spent': _budgets[idx].spent});
      notifyListeners();
    }
  }
}
