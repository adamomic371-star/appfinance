class CategoryModel {
  final String id;
  final String userId;
  final String name;
  final String icon;
  final String type; // income, expense, both
  final String? color;
  final int order;
  final DateTime createdAt;

  CategoryModel({
    required this.id,
    required this.userId,
    required this.name,
    this.icon = 'more_horiz',
    this.type = 'expense',
    this.color,
    this.order = 0,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'id': id,
    'userId': userId,
    'name': name,
    'icon': icon,
    'type': type,
    'color': color,
    'order': order,
    'createdAt': createdAt.toIso8601String(),
  };

  factory CategoryModel.fromMap(String id, Map data) => CategoryModel(
    id: id,
    userId: data['userId'] ?? '',
    name: data['name'] ?? '',
    icon: data['icon'] ?? 'more_horiz',
    type: data['type'] ?? 'expense',
    color: data['color'],
    order: data['order'] ?? 0,
    createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']) : DateTime.now(),
  );
}
