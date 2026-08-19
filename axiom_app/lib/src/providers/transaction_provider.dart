import package
  Map<String, double> getCategoryTotals(int month, int year, String type) {
+
    final map = <String, double>{};
+
    for (final tx in _transactions) {
+
      if (tx.type == type && tx.date.month == month && tx.date.year == year) {
+
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
+
      }
+
    }
+
    return map;
+
  }
}
