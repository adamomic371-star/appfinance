class UserModel {
  final String id;
  final String? email;
  final String? name;
  final String? photoUrl;
  final String? paypalEmail;
  final String plan;
  final String currency;
  final String theme;
  final DateTime? createdAt;
  final bool emailVerified;

  UserModel({
    required this.id,
    this.email,
    this.name,
    this.photoUrl,
    this.paypalEmail,
    this.plan = 'Free',
    this.currency = 'EUR',
    this.theme = 'dark',
    this.createdAt,
    this.emailVerified = false,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'email': email,
    'name': name,
    'photoUrl': photoUrl,
    'paypalEmail': paypalEmail,
    'plan': plan,
    'currency': currency,
    'theme': theme,
    'createdAt': createdAt?.toIso8601String(),
  };

  factory UserModel.fromMap(String id, Map data) => UserModel(
    id: id,
    email: data['email'],
    name: data['name'],
    photoUrl: data['photoUrl'],
    paypalEmail: data['paypalEmail'],
    plan: data['plan'] ?? 'Free',
    currency: data['currency'] ?? 'EUR',
    theme: data['theme'] ?? 'dark',
    createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']) : null,
    emailVerified: data['emailVerified'] ?? false,
  );

  UserModel copyWith({
    String? name,
    String? photoUrl,
    String? paypalEmail,
    String? plan,
    String? currency,
    String? theme,
  }) => UserModel(
    id: id,
    email: email,
    name: name ?? this.name,
    photoUrl: photoUrl ?? this.photoUrl,
    paypalEmail: paypalEmail ?? this.paypalEmail,
    plan: plan ?? this.plan,
    currency: currency ?? this.currency,
    theme: theme ?? this.theme,
    createdAt: createdAt,
    emailVerified: emailVerified,
  );
}
