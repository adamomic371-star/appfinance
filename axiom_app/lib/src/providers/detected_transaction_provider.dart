import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../services/notification_service.dart';
import '../services/notification_parser.dart';
import '../models/transaction.dart';

class DetectedTransactionProvider extends ChangeNotifier {
  final List<DetectedTransaction> _transactions = [];
  final Set<String> _processedKeys = {};
  bool _initialized = false;

  List<DetectedTransaction> get transactions => List.unmodifiable(_transactions);
  bool get initialized => _initialized;

  DetectedTransactionProvider() {
    _listen();
  }

  void _listen() {
    NotificationService.notificationStream.listen((raw) {
      final key = '${raw.packageName}:${raw.tag}:${raw.id}';
      if (_processedKeys.contains(key)) return;
      _processedKeys.add(key);

      final detected = NotificationParser.parse(raw);
      if (detected != null) {
        _transactions.insert(0, detected);
        notifyListeners();
      }
    });
    _initialized = true;
  }

  void remove(int index) {
    if (index >= 0 && index < _transactions.length) {
      _transactions.removeAt(index);
      notifyListeners();
    }
  }

  TransactionModel? toTransaction(int index, String userId) {
    if (index < 0 || index >= _transactions.length) return null;
    final d = _transactions[index];
    return TransactionModel(
      id: const Uuid().v4(),
      userId: userId,
      amount: d.amount,
      type: d.type,
      category: d.category,
      note: d.merchant,
      date: d.date,
    );
  }

  void clear() {
    _transactions.clear();
    notifyListeners();
  }
}
