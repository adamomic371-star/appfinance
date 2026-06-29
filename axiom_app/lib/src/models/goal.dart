class GoalModel {
  final String id;
  final String userId;
  final String name;
  final double targetAmount;
  final double currentAmount;
  final DateTime? deadline;
  final String icon;
  final String? color;
  final bool remindStart;
  final bool remindMid;
  final bool remindComplete;
  final DateTime createdAt;

  GoalModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.targetAmount,
    this.currentAmount = 0,
    this.deadline,
    this.icon = 'savings',
    this.color,
    this.remindStart = false,
    this.remindMid = false,
    this.remindComplete = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  double get progress => targetAmount > 0 ? (currentAmount / targetAmount) : 0;
  double get remaining => targetAmount - currentAmount;

  Map<String, dynamic> toMap() => {
    'id': id,
    'userId': userId,
    'name': name,
    'targetAmount': targetAmount,
    'currentAmount': currentAmount,
    'deadline': deadline?.toIso8601String(),
    'icon': icon,
    'color': color,
    'remindStart': remindStart,
    'remindMid': remindMid,
    'remindComplete': remindComplete,
    'createdAt': createdAt.toIso8601String(),
  };

  factory GoalModel.fromMap(String id, Map data) => GoalModel(
    id: id,
    userId: data['userId'] ?? '',
    name: data['name'] ?? '',
    targetAmount: (data['targetAmount'] ?? 0).toDouble(),
    currentAmount: (data['currentAmount'] ?? 0).toDouble(),
    deadline: data['deadline'] != null ? DateTime.parse(data['deadline']) : null,
    icon: data['icon'] ?? 'savings',
    color: data['color'],
    remindStart: data['remindStart'] ?? false,
    remindMid: data['remindMid'] ?? false,
    remindComplete: data['remindComplete'] ?? false,
    createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']) : DateTime.now(),
  );

  GoalModel copyWith({double? currentAmount, String? name, double? targetAmount}) => GoalModel(
    id: id,
    userId: userId,
    name: name ?? this.name,
    targetAmount: targetAmount ?? this.targetAmount,
    currentAmount: currentAmount ?? this.currentAmount,
    deadline: deadline,
    icon: icon,
    color: color,
    remindStart: remindStart,
    remindMid: remindMid,
    remindComplete: remindComplete,
  );
}
