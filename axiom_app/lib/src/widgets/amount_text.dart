import 'package:flutter/material.dart';
import '../config/theme.dart';

class AmountText extends StatelessWidget {
  final double amount;
  final bool showSign;
  final double fontSize;
  final FontWeight fontWeight;
  final bool compact;

  const AmountText({
    super.key,
    required this.amount,
    this.showSign = false,
    this.fontSize = 16,
    this.fontWeight = FontWeight.w600,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final isNegative = amount < 0;
    final absAmount = amount.abs();
    final sign = showSign && amount > 0 ? '+' : (isNegative ? '-' : '');
    final formatted = compact ? _formatCompact(absAmount) : _formatFull(absAmount);
    final color = amount == 0
        ? Theme.of(context).textTheme.bodyLarge?.color
        : amount > 0
            ? AppTheme.green
            : AppTheme.primary;

    return Text(
      '$sign$formatted',
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        fontFamily: 'monospace',
      ),
    );
  }

  String _formatFull(double amount) {
    return '€ ${amount.toStringAsFixed(2)}';
  }

  String _formatCompact(double amount) {
    if (amount >= 1000000) return '€ ${(amount / 1000000).toStringAsFixed(1)}M';
    if (amount >= 1000) return '€ ${(amount / 1000).toStringAsFixed(1)}k';
    return '€ ${amount.toStringAsFixed(0)}';
  }
}
