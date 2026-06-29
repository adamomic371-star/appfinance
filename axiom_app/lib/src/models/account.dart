class AccountModel {
  final String id;
  final String userId;
  final String name;
  final String type; // bank, card, paypal, cash, crypto, investment
  final double balance;
  final String currency;
  final String? color;
  final bool isMain;
  final double? freeMoney;
  final double? allocated;
  final double? goalsAmount;
  final DateTime createdAt;

  AccountModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.type,
    this.balance = 0,
    this.currency = 'EUR',
    this.color,
    this.isMain = false,
    this.freeMoney,
    this.allocated,
    this.goalsAmount,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'id': id,
    'userId': userId,
    'name': name,
    'type': type,
    'balance': balance,
    'currency': currency,
    'color': color,
    'isMain': isMain,
    'freeMoney': freeMoney,
    'allocated': allocated,
    'goalsAmount': goalsAmount,
    'createdAt': createdAt.toIso8601String(),
  };

  factory AccountModel.fromMap(String id, Map data) => AccountModel(
    id: id,
    userId: data['userId'] ?? '',
    name: data['name'] ?? '',
    type: data['type'] ?? 'bank',
    balance: (data['balance'] ?? 0).toDouble(),
    currency: data['currency'] ?? 'EUR',
    color: data['color'],
    isMain: data['isMain'] ?? false,
    freeMoney: data['freeMoney']?.toDouble(),
    allocated: data['allocated']?.toDouble(),
    goalsAmount: data['goalsAmount']?.toDouble(),
    createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']) : DateTime.now(),
  );

  AccountModel copyWith({
    String? name,
    String? type,
    double? balance,
    String? currency,
    String? color,
    bool? isMain,
  }) => AccountModel(
    id: id,
    userId: userId,
    name: name ?? this.name,
    type: type ?? this.type,
    balance: balance ?? this.balance,
    currency: currency ?? this.currency,
    color: color ?? this.color,
    isMain: isMain ?? this.isMain,
  );
}
