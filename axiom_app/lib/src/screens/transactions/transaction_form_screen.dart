import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/transaction.dart';
import '../../providers/auth_provider.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/account_provider.dart';
import '../../providers/category_provider.dart';
import '../../widgets/amount_text.dart';

class TransactionFormScreen extends StatefulWidget {
  final TransactionModel? transaction;
  const TransactionFormScreen({super.key, this.transaction});

  @override
  State<TransactionFormScreen> createState() => _TransactionFormScreenState();
}

class _TransactionFormScreenState extends State<TransactionFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  String _type = 'expense';
  String _category = 'Altro';
  String? _accountId;
  DateTime _date = DateTime.now();
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.transaction != null) {
      final tx = widget.transaction!;
      _amountController.text = tx.amount.toString();
      _noteController.text = tx.note ?? '';
      _type = tx.type;
      _category = tx.category;
      _accountId = tx.accountId;
      _date = tx.date;
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final auth = context.read<AuthProvider>();
    final txProvider = context.read<TransactionProvider>();
    final amount = double.parse(_amountController.text);

    if (widget.transaction != null) {
      final updated = widget.transaction!.copyWith(
        amount: amount,
        type: _type,
        category: _category,
        accountId: _accountId,
        note: _noteController.text.isEmpty ? null : _noteController.text,
        date: _date,
      );
      await txProvider.edit(updated);
    } else {
      final newTx = TransactionModel(
        id: '',
        userId: auth.userId,
        amount: amount,
        type: _type,
        category: _category,
        accountId: _accountId,
        note: _noteController.text.isEmpty ? null : _noteController.text,
        date: _date,
      );
      await txProvider.add(newTx);
    }

    if (mounted) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.transaction != null ? 'Transazione aggiornata' : 'Transazione creata')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = context.watch<CategoryProvider>().categories.isNotEmpty
        ? context.watch<CategoryProvider>().getByType(_type)
        : context.read<CategoryProvider>().categories;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.transaction != null ? 'Modifica Transazione' : 'Nuova Transazione'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(child: _TypeButton('expense', 'Uscita', Icons.arrow_downward, AppTheme.primary)),
                const SizedBox(width: 12),
                Expanded(child: _TypeButton('income', 'Entrata', Icons.arrow_upward, AppTheme.green)),
              ],
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _amountController,
              decoration: const InputDecoration(
                labelText: 'Importo',
                prefixText: '€ ',
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Inserisci importo';
                if (double.tryParse(v) == null) return 'Importo non valido';
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Categoria'),
              items: [
                'Casa', 'Cibo', 'Trasporti', 'Bollette', 'Salute',
                'Abbigliamento', 'Intrattenimento', 'Istruzione', 'Viaggi',
                'Stipendio', 'Freelance', 'Investimenti', 'Vendite',
                'Altro',
              ].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _category = v ?? 'Altro'),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: 'Nota (opzionale)'),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.calendar_today),
              title: Text('${_date.day}/${_date.month}/${_date.year}'),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                );
                if (picked != null) setState(() => _date = picked);
              },
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity, height: 50,
              child: ElevatedButton(
                onPressed: _loading ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _loading
                    ? const CircularProgressIndicator(strokeWidth: 2, color: Colors.white)
                    : Text(widget.transaction != null ? 'Aggiorna' : 'Salva',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _TypeButton(String type, String label, IconData icon, Color color) {
    final selected = _type == type;
    return GestureDetector(
      onTap: () => setState(() => _type = type),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.15) : Colors.grey[850],
          borderRadius: BorderRadius.circular(12),
          border: selected ? Border.all(color: color, width: 2) : null,
        ),
        child: Column(
          children: [
            Icon(icon, color: selected ? color : Colors.grey, size: 28),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(
              color: selected ? color : Colors.grey,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
            )),
          ],
        ),
      ),
    );
  }
}
