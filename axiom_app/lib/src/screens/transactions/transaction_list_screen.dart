import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/transaction_provider.dart';
import '../../models/transaction.dart';
import '../../widgets/amount_text.dart';

class TransactionListScreen extends StatefulWidget {
  const TransactionListScreen({super.key});

  @override
  State<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends State<TransactionListScreen> {
  final _searchController = TextEditingController();
  String? _filterType;
  String? _filterCategory;
  bool _selectionMode = false;
  final Set<String> _selectedIds = {};

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  IconData _getIcon(String category) {
    const icons = {
      'Casa': Icons.home, 'Cibo': Icons.restaurant, 'Trasporti': Icons.directions_car,
      'Bollette': Icons.receipt, 'Salute': Icons.local_hospital, 'Stipendio': Icons.work,
      'Freelance': Icons.brush, 'Investimenti': Icons.trending_up, 'Vendite': Icons.sell,
      'Altro': Icons.more_horiz,
    };
    return icons[category] ?? Icons.more_horiz;
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<TransactionProvider>();
    final transactions = provider.transactions;

    return Scaffold(
      appBar: AppBar(
        title: Text(_selectionMode ? '${_selectedIds.length} selezionati' : 'Transazioni'),
        actions: [
          if (_selectionMode) ...[
            IconButton(
              icon: const Icon(Icons.delete, color: AppTheme.primary),
              onPressed: _selectedIds.isEmpty ? null : () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Elimina transazioni'),
                    content: Text('Eliminare ${_selectedIds.length} transazioni?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annulla')),
                      TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Elimina')),
                    ],
                  ),
                );
                if (confirm == true) {
                  provider.bulkDelete(_selectedIds.toList());
                  _selectedIds.clear();
                  _selectionMode = false;
                }
              },
            ),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                _selectedIds.clear();
                setState(() => _selectionMode = false);
              },
            ),
          ] else ...[
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () => _showSearch(context, provider),
            ),
            IconButton(
              icon: const Icon(Icons.filter_list),
              onPressed: () => _showFilters(context, provider),
            ),
          ],
        ],
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : transactions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long, size: 64, color: Colors.grey[600]),
                      const SizedBox(height: 16),
                      Text('Nessuna transazione', style: TextStyle(color: Colors.grey[400], fontSize: 18)),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () => Navigator.pushNamed(context, '/transaction/new'),
                        child: const Text('Aggiungi transazione'),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: transactions.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Text('${transactions.length} transazioni',
                              style: TextStyle(color: Colors.grey[400])),
                            const Spacer(),
                            AmountText(amount: provider.totalIncome - provider.totalExpenses,
                              fontSize: 14, showSign: true),
                          ],
                        ),
                      );
                    }
                    final tx = transactions[index - 1];
                    final isExpense = tx.type == 'expense';
                    final selected = _selectedIds.contains(tx.id);

                    return GestureDetector(
                      onLongPress: () {
                        setState(() {
                          _selectionMode = true;
                          _selectedIds.add(tx.id);
                        });
                      },
                      onTap: _selectionMode
                          ? () => setState(() {
                              if (selected) _selectedIds.remove(tx.id);
                              else _selectedIds.add(tx.id);
                              if (_selectedIds.isEmpty) _selectionMode = false;
                            })
                          : () => Navigator.pushNamed(context, '/transaction/edit', arguments: tx),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppTheme.primary.withOpacity(0.15)
                              : Theme.of(context).cardTheme.color,
                          borderRadius: BorderRadius.circular(12),
                          border: selected ? Border.all(color: AppTheme.primary.withOpacity(0.3)) : null,
                        ),
                        child: Row(
                          children: [
                            if (_selectionMode)
                              Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: Icon(
                                  selected ? Icons.check_circle : Icons.radio_button_unchecked,
                                  color: selected ? AppTheme.primary : Colors.grey,
                                  size: 22,
                                ),
                              ),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: (isExpense ? AppTheme.primary : AppTheme.green).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(_getIcon(tx.category),
                                color: isExpense ? AppTheme.primary : AppTheme.green, size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(tx.category, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                  if (tx.note != null && tx.note!.isNotEmpty)
                                    Text(tx.note!, style: TextStyle(color: Colors.grey[500], fontSize: 11), maxLines: 1),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                AmountText(amount: tx.amount, showSign: true, fontSize: 13),
                                Text('${tx.date.day}/${tx.date.month}/${tx.date.year}',
                                  style: TextStyle(color: Colors.grey[500], fontSize: 10)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/transaction/new'),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showSearch(BuildContext context, TransactionProvider provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardTheme.color,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 16, right: 16, top: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Cerca transazioni...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) {
                provider.setSearchQuery(v);
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showFilters(BuildContext context, TransactionProvider provider) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardTheme.color,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Filtri', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            const Text('Tipo'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                _FilterChip('Tutti', _filterType == null, () {
                  provider.setFilterType(null);
                  Navigator.pop(ctx);
                }),
                _FilterChip('Entrate', _filterType == 'income', () {
                  provider.setFilterType('income');
                  Navigator.pop(ctx);
                }),
                _FilterChip('Uscite', _filterType == 'expense', () {
                  provider.setFilterType('expense');
                  Navigator.pop(ctx);
                }),
              ],
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                provider.clearFilters();
                Navigator.pop(ctx);
              },
              child: const Text('Cancella filtri'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip(this.label, this.selected, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : Colors.grey[800],
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label, style: TextStyle(
          color: selected ? Colors.white : Colors.grey[300],
          fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
        )),
      ),
    );
  }
}
