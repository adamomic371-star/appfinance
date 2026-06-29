import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/account_provider.dart';
import '../../widgets/amount_text.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final userId = context.read<AuthProvider>().userId;
    if (userId.isNotEmpty) {
      context.read<TransactionProvider>().load(userId);
      context.read<AccountProvider>().load(userId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final txProvider = context.watch<TransactionProvider>();
    final accountProvider = context.watch<AccountProvider>();
    final userName = auth.user?.name ?? 'Utente';
    final now = DateTime.now();
    final months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    final currentBalance = accountProvider.totalBalance;

    return Scaffold(
      appBar: AppBar(
        title: Text('Ciao, ${userName.split(' ')[0]}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.pushNamed(context, '/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadData(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('${months[now.month - 1]} ${now.year}',
              style: TextStyle(color: Colors.grey[400], fontSize: 14)),
            const SizedBox(height: 4),
            AmountText(amount: currentBalance, fontSize: 32, fontWeight: FontWeight.w800),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: _SummaryCard(
                  icon: Icons.arrow_upward,
                  label: 'Entrate',
                  amount: txProvider.totalIncome,
                  color: AppTheme.green,
                )),
                const SizedBox(width: 12),
                Expanded(child: _SummaryCard(
                  icon: Icons.arrow_downward,
                  label: 'Uscite',
                  amount: txProvider.totalExpenses,
                  color: AppTheme.primary,
                )),
              ],
            ),
            const SizedBox(height: 24),
            Text('Transazioni Recenti',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.grey[200])),
            const SizedBox(height: 12),
            if (txProvider.loading)
              ...List.generate(3, (i) => _TransactionSkeleton())
            else if (txProvider.transactions.isEmpty)
              _EmptyState()
            else
              ...txProvider.transactions.take(5).map((tx) => _TransactionItem(tx: tx)),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final double amount;
  final Color color;

  const _SummaryCard({required this.icon, required this.label, required this.amount, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(label, style: TextStyle(color: Colors.grey[400], fontSize: 13)),
          const SizedBox(height: 4),
          AmountText(amount: amount, fontSize: 18, fontWeight: FontWeight.w700),
        ],
      ),
    );
  }
}

class _TransactionItem extends StatelessWidget {
  final dynamic tx;
  const _TransactionItem({required this.tx});

  IconData _getIcon(String category) {
    const icons = {
      'Casa': Icons.home, 'Cibo': Icons.restaurant, 'Trasporti': Icons.directions_car,
      'Bollette': Icons.receipt, 'Salute': Icons.local_hospital, 'Stipendio': Icons.work,
      'Freelance': Icons.brush, 'Investimenti': Icons.trending_up,
    };
    return icons[category] ?? Icons.more_horiz;
  }

  @override
  Widget build(BuildContext context) {
    final isExpense = tx.type == 'expense';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (isExpense ? AppTheme.primary : AppTheme.green).withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(_getIcon(tx.category), color: isExpense ? AppTheme.primary : AppTheme.green, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx.category, style: const TextStyle(fontWeight: FontWeight.w600)),
                if (tx.note != null && tx.note!.isNotEmpty)
                  Text(tx.note!, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              AmountText(amount: tx.amount, showSign: true, fontSize: 14),
              Text('${tx.date.day}/${tx.date.month}', style: TextStyle(color: Colors.grey[500], fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}

class _TransactionSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      height: 60,
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color?.withOpacity(0.5),
        borderRadius: BorderRadius.circular(14),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Icon(Icons.receipt_long, size: 48, color: Colors.grey[600]),
          const SizedBox(height: 12),
          Text('Nessuna transazione',
            style: TextStyle(color: Colors.grey[500])),
          Text('Aggiungi la tua prima transazione',
            style: TextStyle(color: Colors.grey[600], fontSize: 12)),
        ],
      ),
    );
  }
}
