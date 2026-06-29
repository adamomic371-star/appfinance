import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/detected_transaction_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/notification_parser.dart';
import '../../widgets/amount_text.dart';
import '../transactions/transaction_form_screen.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DetectedTransactionProvider>();
    final transactions = provider.transactions;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifiche Rilevate'),
        actions: [
          if (transactions.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Cancella tutte'),
                    content: Text('Eliminare ${transactions.length} notifiche rilevate?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annulla')),
                      TextButton(
                        onPressed: () {
                          provider.clear();
                          Navigator.pop(ctx);
                        },
                        child: const Text('Cancella'),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
      body: transactions.isEmpty
          ? _buildEmpty(context)
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: transactions.length,
              itemBuilder: (_, i) => _buildCard(context, transactions[i], i, provider),
            ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.notifications_none, size: 72,
              color: isDark ? Colors.white24 : Colors.black12),
            const SizedBox(height: 16),
            Text('Nessuna notifica rilevata',
              style: TextStyle(fontSize: 18, color: isDark ? Colors.white54 : Colors.black38)),
            const SizedBox(height: 8),
            Text(
              'Le notifiche di Google Wallet, Samsung Pay,\nbanche e SMS verranno mostrate qui.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: isDark ? Colors.white38 : Colors.black26),
            ),
            const SizedBox(height: 24),
            _buildPermissionGuide(context, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildPermissionGuide(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, size: 18, color: Colors.orange.shade700),
              const SizedBox(width: 8),
              Text('Permessi richiesti',
                style: TextStyle(fontWeight: FontWeight.w600, color: Colors.orange.shade700)),
            ],
          ),
          const SizedBox(height: 8),
          _permissionStep('1. Vai a Impostazioni → Accesso Notifiche'),
          _permissionStep('2. Cerca "Axiom" e abilita l\'accesso'),
          _permissionStep('3. Le prossime notifiche bancarie verranno rilevate'),
        ],
      ),
    );
  }

  Widget _permissionStep(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4, left: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 13)),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }

  Widget _buildCard(BuildContext context, DetectedTransaction dt, int index,
      DetectedTransactionProvider provider) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF181B3D) : Colors.white;
    final amountColor = dt.type == 'income' ? AppTheme.green : AppTheme.primary;
    final icon = dt.type == 'income' ? Icons.arrow_downward : Icons.arrow_upward;

    return Card(
      color: bg,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: amountColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: amountColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(dt.merchant,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text('${dt.category} • ${dt.source}',
                        style: TextStyle(fontSize: 12, color: isDark ? Colors.white38 : Colors.black38)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    AmountText(amount: dt.amount.abs(), fontSize: 16),
                    Text(
                      '${dt.date.day}/${dt.date.month}/${dt.date.year}',
                      style: TextStyle(fontSize: 11, color: isDark ? Colors.white38 : Colors.black38),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  icon: const Icon(Icons.close, size: 16),
                  label: const Text('Ignora', style: TextStyle(fontSize: 12)),
                  onPressed: () => provider.remove(index),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Aggiungi', style: TextStyle(fontSize: 12)),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () {
                    final auth = context.read<AuthProvider>();
                    if (!auth.isLoggedIn) return;
                    final tx = provider.toTransaction(index, auth.user!.id);
                    if (tx != null) {
                      provider.remove(index);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TransactionFormScreen(transaction: tx, fromNotification: true),
                        ),
                      );
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
