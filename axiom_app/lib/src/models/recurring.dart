class RecurringModel {
  final String id;
  final String userId;
  final String name;
  final double amount;
  final String type; // income | expense
  final String category;
  final String frequency; // weekly, monthly, quarterly, yearly
  final int dayOfMonth;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? nextDate;
  final bool isActive;
  final String? accountId;
  final String? note;
  final DateTime createdAt;

  RecurringModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.amount,
    required this.type,
    required this.category,
    this.frequency = 'monthly',
    this.dayOfMonth = 1,
    this.startDate,
    this.endDate,
    this.nextDate,
    this.isActive = true,
    this.accountId,
    this.note,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'id': id,
    'userId': userId,
    'name': name,
    'amount': amount,
    'type': type,
    'category': category,
    'frequency': frequency,
    'dayOfMonth': dayOfMonth,
    'startDate': startDate?.toIso8601String(),
    'endDate': endDate?.toIso8601String(),
    'nextDate': nextDate?.toIso8601String(),
    'isActive': isActive,
    'accountId': accountId,
    'note': note,
    'createdAt': createdAt.toIso8601String(),
  };

  factory RecurringModel.fromMap(String id, Map data) => RecurringModel(
    id: id,
    userId: data['userId'] ?? '',
    name: data['name'] ?? '',
    amount: (data['amount'] ?? 0).toDouble(),
    type: data['type'] ?? 'expense',
    category: data['category'] ?? '',
    frequency: data['frequency'] ?? 'monthly',
    dayOfMonth: data['dayOfMonth'] ?? 1,
    startDate: data['startDate'] != null ? DateTime.parse(data['startDate']) : null,
    endDate: data['endDate'] != null ? DateTime.parse(data['endDate']) : null,
    nextDate: data['nextDate'] != null ? DateTime.parse(data['nextDate']) : null,
    isActive: data['isActive'] ?? true,
    accountId: data['accountId'],
    note: data['note'],
    createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']) : DateTime.now(),
  );
}
