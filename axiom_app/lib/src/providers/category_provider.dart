import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/category.dart';
import '../services/db_service.dart';

class CategoryProvider extends ChangeNotifier {
  final FirebaseDbService _db = FirebaseDbService();
  final _uuid = const Uuid();

  List<CategoryModel> _categories = [];

  List<CategoryModel> get categories => _categories;

  List<CategoryModel> getByType(String type) {
    if (type == 'both') return _categories;
    return _categories.where((c) => c.type == type || c.type == 'both').toList();
  }

  Future<void> load(String userId) async {
    final data = await _db.getAll('categories');
    _categories = data
        .where((d) => d['userId'] == userId)
        .map((d) => CategoryModel.fromMap(d['id'], d))
        .toList();
    notifyListeners();
  }

  Future<void> add(CategoryModel category) async {
    final id = _uuid.v4();
    final data = category.toMap();
    data['id'] = id;
    await _db.set('categories/$id', data);
    _categories.add(CategoryModel(
      id: id,
      userId: category.userId,
      name: category.name,
      icon: category.icon,
      type: category.type,
      color: category.color,
    ));
    notifyListeners();
  }

  Future<void> update(CategoryModel category) async {
    await _db.update('categories/${category.id}', category.toMap());
    final idx = _categories.indexWhere((c) => c.id == category.id);
    if (idx >= 0) _categories[idx] = category;
    notifyListeners();
  }

  Future<void> delete(String id) async {
    await _db.delete('categories/$id');
    _categories.removeWhere((c) => c.id == id);
    notifyListeners();
  }
}
