class DebtModel {
  final String id;
  final String userId;
  final String name;
  final String type; // mortgage, personal, car, credit_card, other
  final double totalAmount;
  final double remainingAmount;
  final double monthlyPayment;
  final double interestRate;
  final String? note;
  final DateTime createdAt;

  DebtModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.type,
    required this.totalAmount,
    this.remainingAmount = 0,
    this.monthlyPayment = 0,
    this.interestRate = 0,
    this.note,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  double get progress => totalAmount > 0 ? ((totalAmount - remainingAmount) / totalAmount) : 0;

  Map<String, dynamic> toMap() => {
    'id': id,
    'userId': userId,
    'name': name,
    'type': type,
    'totalAmount': totalAmount,
    'remainingAmount': remainingAmount,
    'monthlyPayment': monthlyPayment,
    'interestRate': interestRate,
    'note': note,
    'createdAt': createdAt.toIso8601String(),
  };

  factory DebtModel.fromMap(String id, Map data) => DebtModel(
    id: id,
    userId: data['userId'] ?? '',
    name: data['name'] ?? '',
    type: data['type'] ?? 'other',
    totalAmount: (data['totalAmount'] ?? 0).toDouble(),
    remainingAmount: (data['remainingAmount'] ?? 0).toDouble(),
    monthlyPayment: (data['monthlyPayment'] ?? 0).toDouble(),
    interestRate: (data['interestRate'] ?? 0).toDouble(),
    note: data['note'],
    createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']) : DateTime.now(),
  );
}
