import 'notification_service.dart';

class DetectedTransaction {
  final double amount;
  final String merchant;
  final String type;
  final String category;
  final String source;
  final DateTime date;
  final String rawText;
  final String packageName;

  DetectedTransaction({
    required this.amount,
    required this.merchant,
    required this.type,
    required this.category,
    required this.source,
    required this.date,
    required this.rawText,
    required this.packageName,
  });

  Map<String, dynamic> toMap() => {
    'amount': amount,
    'merchant': merchant,
    'type': type,
    'category': category,
    'source': source,
    'date': date.toIso8601String(),
    'rawText': rawText,
    'packageName': packageName,
  };
}

class NotificationParser {
  static final List<_Pattern> _patterns = [
    // Google Wallet: "Pagamento di €15,50 presso NEGOZIO"
    _Pattern(
      r'(?:pagamento|addebito|spesa)\s+di\s+[€]?\s*([\d.,]+)\s*(?:€)?\s*(?:presso|da|in|con)\s+(.+)',
      'Google Wallet',
      'Spesa'),
    // Google Wallet: "Pagamento EUR 15,50 - NEGOZIO"
    _Pattern(
      r'(?:pagamento|addebito)\s+(?:EUR|€)\s*([\d.,]+)\s*[–\-]\s*(.+)',
      'Google Wallet',
      'Spesa'),
    // Samsung Wallet: "Spesa di €15,50 - NEGOZIO"
    _Pattern(
      r'(?:spesa|pagamento|acquisto)\s+(?:di\s+)?[€]?\s*([\d.,]+)\s*(?:€)?\s*[–\-]\s*(.+)',
      'Samsung Wallet',
      'Spesa'),
    // SMS: "Acquisto di €15,50 effettuato con carta ****1234 presso NEGOZIO"
    _Pattern(
      r'acquisto\s+di\s+[€]?\s*([\d.,]+)\s*(?:€)?.*?presso\s+(.+)',
      'SMS Bancario',
      'Spesa'),
    // SMS: "Pagamento €15,50 presso NEGOZIO con carta ****1234"
    _Pattern(
      r'pagamento\s+[€]?\s*([\d.,]+)\s*(?:€)?.*?presso\s+(.+)',
      'SMS Bancario',
      'Spesa'),
    // Intesa Sanpaolo: "Carta di credito - €15,50 - NEGOZIO"
    _Pattern(
      r'(?:carta\s+(?:di\s+)?(?:credito|debito| prepagata))\s*[–\-]\s*[€]?\s*([\d.,]+)\s*(?:€)?\s*[–\-]\s*(.+)',
      'Intesa Sanpaolo',
      'Spesa'),
    // Postepay: "Postepay - €15,50 - Acquisto presso NEGOZIO"
    _Pattern(
      r'postepay\s*[–\-]\s*[€]?\s*([\d.,]+)\s*(?:€)?\s*(?:[–\-])?\s*(?:acquisto\s+)?presso\s+(.+)',
      'Postepay',
      'Spesa'),
    // UniCredit/Fineco: "Carta ****1234 - €15,50 - NEGOZIO"
    _Pattern(
      r'carta\s+\*{2,}\d{1,4}\s*[–\-]\s*[€]?\s*([\d.,]+)\s*(?:€)?\s*[–\-]\s*(.+)',
      'Carta Bancaria',
      'Spesa'),
    // Income: "accredito di €500,00 da NOME" or "stipendio di €1500"
    _Pattern(
      r'(?:accredito|stipendio|bonifico\s+in\s+entrata)\s+(?:di\s+)?[€]?\s*([\d.,]+)\s*(?:€)?\s*(?:da|di)\s+(.+)',
      'Accredito',
      'income'),
    // Generic fallback for amounts
    _Pattern(
      r'[€]?\s*([\d.,]+)\s*(?:€)',
      'Rilevata',
      'Spesa'),
  ];

  static DetectedTransaction? parse(RawNotification notification) {
    final fullText = '${notification.title} ${notification.text}'.toLowerCase();
    final cleanText = '${notification.title} ${notification.text}';

    for (final pattern in _patterns) {
      final match = RegExp(pattern.regex, caseSensitive: false).firstMatch(fullText);
      if (match != null) {
        final amountStr = match.group(1)!.replaceAll('.', '').replaceAll(',', '.');
        final amount = double.tryParse(amountStr) ?? 0.0;
        final merchant = match.group(2)?.trim() ?? 'Sconosciuto';
        final category = _categorize(merchant);

        return DetectedTransaction(
          amount: amount,
          merchant: merchant[0].toUpperCase() + merchant.substring(1),
          type: pattern.type,
          category: category,
          source: pattern.source,
          date: DateTime.fromMillisecondsSinceEpoch(notification.postTime),
          rawText: cleanText,
          packageName: notification.packageName,
        );
      }
    }

    return null;
  }

  static String _categorize(String text) {
    final t = text.toLowerCase();
    if (t.contains('supermercato') || t.contains('carrefour') ||
        t.contains('esselunga') || t.contains('conad') || t.contains('coop') ||
        t.contains('lidl') || t.contains('aldi') || t.contains('pam') ||
        t.contains('tigre')) return 'Alimentari';
    if (t.contains('benzina') || t.contains('gas') || t.contains('enì') ||
        t.contains('eni') || t.contains('esso') || t.contains('tamoil') ||
        t.contains('q8') || t.contains('ip')) return 'Carburante';
    if (t.contains('amazon') || t.contains('ebay') || t.contains('subito')) return 'Shopping Online';
    if (t.contains('ristorante') || t.contains('pizzeria') || t.contains('bar') ||
        t.contains('mcdonald') || t.contains('kfc') || t.contains('sushi')) return 'Ristorazione';
    if (t.contains('netflix') || t.contains('spotify') || t.contains('prime') ||
        t.contains('disney') || t.contains('dazn') || t.contains('tim') ||
        t.contains('vodafone') || t.contains('wind')) return 'Abbonamenti';
    if (t.contains('farmacia') || t.contains('dottore') || t.contains('medico') ||
        t.contains('ospedale')) return 'Salute';
    if (t.contains('tren') || t.contains('bus') || t.contains('taxi') ||
        t.contains('uber') || t.contains('flixbus') || t.contains('aereo') ||
        t.contains('ryanair') || t.contains('easyjet')) return 'Trasporti';
    return 'Spese Generali';
  }
}

class _Pattern {
  final String regex;
  final String source;
  final String type;

  _Pattern(this.regex, this.source, this.type);
}
