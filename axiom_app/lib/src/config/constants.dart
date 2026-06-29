class AppConstants {
  static const String appName = 'Axiom';
  static const String appTagline = 'Smart Finance';

  static const List<String> currencies = ['EUR', 'USD', 'CHF', 'GBP'];
  static const String defaultCurrency = 'EUR';

  static const List<Map<String, dynamic>> transactionCategories = [
    {'name': 'Casa', 'icon': 'home', 'type': 'expense'},
    {'name': 'Cibo', 'icon': 'restaurant', 'type': 'expense'},
    {'name': 'Trasporti', 'icon': 'directions_car', 'type': 'expense'},
    {'name': 'Bollette', 'icon': 'receipt', 'type': 'expense'},
    {'name': 'Salute', 'icon': 'local_hospital', 'type': 'expense'},
    {'name': 'Abbigliamento', 'icon': 'checkroom', 'type': 'expense'},
    {'name': 'Intrattenimento', 'icon': 'movie', 'type': 'expense'},
    {'name': 'Istruzione', 'icon': 'school', 'type': 'expense'},
    {'name': 'Viaggi', 'icon': 'flight', 'type': 'expense'},
    {'name': 'Regali', 'icon': 'card_giftcard', 'type': 'expense'},
    {'name': 'Assicurazioni', 'icon': 'security', 'type': 'expense'},
    {'name': 'Stipendio', 'icon': 'work', 'type': 'income'},
    {'name': 'Freelance', 'icon': 'brush', 'type': 'income'},
    {'name': 'Investimenti', 'icon': 'trending_up', 'type': 'income'},
    {'name': 'Vendite', 'icon': 'sell', 'type': 'income'},
    {'name': 'Rimborsi', 'icon': 'replay', 'type': 'income'},
    {'name': 'Affitti', 'icon': 'meeting_room', 'type': 'income'},
    {'name': 'Altro', 'icon': 'more_horiz', 'type': 'both'},
  ];

  static const List<String> accountTypes = [
    'bank', 'card', 'paypal', 'cash', 'crypto', 'investment',
  ];
}
