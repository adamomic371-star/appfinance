import 'package:firebase_database/firebase_database.dart';

class FirebaseDbService {
  final DatabaseReference _db = FirebaseDatabase.instance.ref();

  DatabaseReference ref(String path) => _db.child(path);

  Future<void> set(String path, Map<String, dynamic> data) => _db.child(path).set(data);

  Future<void> update(String path, Map<String, dynamic> data) => _db.child(path).update(data);

  Future<void> delete(String path) => _db.child(path).remove();

  Future<Map<String, dynamic>?> get(String path) async {
    final snapshot = await _db.child(path).get();
    return snapshot.value as Map<String, dynamic>?;
  }

  DatabaseReference query(String path) => _db.child(path);

  Stream<DatabaseEvent> onChildAdded(String path) => _db.child(path).onChildAdded;

  Stream<DatabaseEvent> onChildChanged(String path) => _db.child(path).onChildChanged;

  Stream<DatabaseEvent> onChildRemoved(String path) => _db.child(path).onChildRemoved;

  Stream<DatabaseEvent> onValue(String path) => _db.child(path).onValue;

  Future<List<Map<String, dynamic>>> getAll(String path) async {
    final snapshot = await _db.child(path).get();
    if (!snapshot.exists) return [];
    final map = snapshot.value as Map<dynamic, dynamic>;
    return map.entries.map((e) {
      final data = Map<String, dynamic>.from(e.value);
      data['id'] = e.key.toString();
      return data;
    }).toList();
  }
}
