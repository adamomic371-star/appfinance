import 'package:intl/intl.dart';

class FormatUtils {
  static final _currencyFormat = NumberFormat.currency(locale: 'it', symbol: '€');
  static final _numberFormat = NumberFormat('#,##0.00', 'it');
  static final _dateFormat = DateFormat('dd/MM/yyyy', 'it');
  static final _monthFormat = DateFormat('MMMM yyyy', 'it');
  static final _dayMonthFormat = DateFormat('dd MMM', 'it');
  static final _shortDateFormat = DateFormat('dd/MM/yy', 'it');

  static String currency(double amount) {
    return _currencyFormat.format(amount);
  }

  static String number(double value) {
    return _numberFormat.format(value);
  }

  static String date(DateTime date) {
    return _dateFormat.format(date);
  }

  static String month(DateTime date) {
    return _monthFormat.format(date);
  }

  static String dayMonth(DateTime date) {
    return _dayMonthFormat.format(date);
  }

  static String shortDate(DateTime date) {
    return _shortDateFormat.format(date);
  }

  static String percent(double value) {
    return '${value.toStringAsFixed(1)}%';
  }

  static String formatAmount(double amount, {bool showSign = false}) {
    if (showSign && amount > 0) return '+${currency(amount)}';
    return currency(amount);
  }
}
