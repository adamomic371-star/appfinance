class TransactionModel {
  final String id;
  final String userId;
  final double amount;
  final String type; // income | expense
  final String category;
  final String? subcategory;
  final String? note;
  final String? accountId;
  final DateTime date;
  final String currency;
  final bool isRecurring;
  final String? receiptUrl;
  final Map<String, double>? split;
  final DateTime createdAt;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.amount,
    required this.type,
    required this.category,
    this.subcategory,
    this.note,
    this.accountId,
    required this.date,
    this.currency = 'EUR',
    this.isRecurring = false,
    this.receiptUrl,
    this.split,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'id': id,
    'userId': userId,
    'amount': amount,
    'type': type,
    'category': category,
    'subcategory': subcategory,
    'note': note,
    'accountId': accountId,
    'date': date.toIso8601String(),
    'currency': currency,
    'isRecurring': isRecurring,
    'receiptUrl': receiptUrl,
    'split': split,
    'createdAt': createdAt.toIso8601String(),
  };

  factory TransactionModel.fromMap(String id, Map data) => TransactionModel(
    id: id,
    userId: data['userId'] ?? '',
    amount: (data['amount'] ?? 0).toDouble(),
    type: data['type'] ?? 'expense',
    category: data['category'] ?? 'Altro',
    subcategory: data['subcategory'],
    note: data['note'],
    accountId: data['accountId'],
    date: data['date'] != null ? DateTime.parse(data['date']) : DateTime.now(),
    currency: data['currency'] ?? 'EUR',
    isRecurring: data['isRecurring'] ?? false,
    receiptUrl: data['receiptUrl'],
    split: data['split'] != null ? Map<String, double>.from(data['split']) : null,
    createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']) : DateTime.now(),
  );

  TransactionModel copyWith({
    String? id,
    double? amount,
    String? type,
    String? category,
    String? subcategory,
    String? note,
    String? accountId,
    DateTime? date,
    String? currency,
    bool? isRecurring,
    String? receiptUrl,
    Map<String, double>? split,
  }) => TransactionModel(
    id: id ?? this.id,
    userId: userId,
    amount: amount ?? this.amount,
    type: type ?? this.type,
    category: category ?? this.category,
    subcategory: subcategory ?? this.subcategory,
    note: note ?? this.note,
    accountId: accountId ?? this.accountId,
    date: date ?? this.date,
    currency: currency ?? this.currency,
    isRecurring: isRecurring ?? this.isRecurring,
    receiptUrl: receiptUrl ?? this.receiptUrl,
    split: split ?? this.split,
  );
}
