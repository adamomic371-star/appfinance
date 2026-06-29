class BudgetModel {
  final String id;
  final String userId;
  final String category;
  final double limit;
  final double spent;
  final int month;
  final int year;
  final DateTime createdAt;

  BudgetModel({
    required this.id,
    required this.userId,
    required this.category,
    required this.limit,
    this.spent = 0,
    required this.month,
    required this.year,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  double get remaining => limit - spent;
  double get percentage => limit > 0 ? (spent / limit) * 100 : 0;

  Map<String, dynamic> toMap() => {
    'id': id,
    'userId': userId,
    'category': category,
    'limit': limit,
    'spent': spent,
    'month': month,
    'year': year,
    'createdAt': createdAt.toIso8601String(),
  };

  factory BudgetModel.fromMap(String id, Map data) => BudgetModel(
    id: id,
    userId: data['userId'] ?? '',
    category: data['category'] ?? '',
    limit: (data['limit'] ?? 0).toDouble(),
    spent: (data['spent'] ?? 0).toDouble(),
    month: data['month'] ?? DateTime.now().month,
    year: data['year'] ?? DateTime.now().year,
    createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']) : DateTime.now(),
  );

  BudgetModel copyWith({double? limit, double? spent}) => BudgetModel(
    id: id,
    userId: userId,
    category: category,
    limit: limit ?? this.limit,
    spent: spent ?? this.spent,
    month: month,
    year: year,
  );
}
