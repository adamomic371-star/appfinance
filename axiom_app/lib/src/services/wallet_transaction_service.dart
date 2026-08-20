import 'dart:convert';
import 'package:firebase_database/firebase_database.dart';
import 'package:uuid/uuid.dart';
import '../models/transaction.dart';
import 'db_service.dart';
import 'package:google_wallet/google_wallet.dart';

class WalletTransactionService {
  final FirebaseDbService _db = FirebaseDbService();
  final _uuid = const Uuid();

  String get _basePath => 'transactions';

  /// Creates a transaction from Google Pay payment data
  Future<TransactionModel> createFromPayment({
    required String amount,
    required String currency,
    required String description,
    required DateTime date,
    required String category,
    String? subcategory,
    String? note,
    String type = 'expense',
    String? accountId,
  }) async {
    final tx = TransactionModel(
      id: _uuid.v4(),
      userId: '', // Will be set when saving
      amount: double.tryParse(amount) ?? 0.0,
      type: type,
      category: category,
      subcategory: subcategory,
      note: note,
      accountId: accountId,
      date: date,
      currency: currency,
      isRecurring: false,
      receiptUrl: null,
      split: null,
    );

    final data = tx.toMap();
    data['id'] = tx.id;
    await _db.set('$_basePath/${tx.id}', data);

    return tx.copyWith(userId: ''); // User ID set separately
  }

  /// Saves a Google Pay transaction result and creates the database entry
  Future<TransactionModel> savePaymentResult({
    required PaymentData paymentData,
    required String userId,
    required String category,
    String type = 'expense',
  }) async {
    // Extract payment details
    final amount = paymentData.transactionSummary.price;
    final currency = paymentData.transactionSummary.currencyCode ?? 'EUR';
    final description = paymentData.merchantName ?? 'Google Pay';
    final date = DateTime.now();

    // Parse date from payment if available, otherwise use now
    DateTime transactionDate = date;
    if (paymentData.paymentMethodName != null) {
      // Could parse additional date info if needed
    }

    final tx = TransactionModel(
      id: _uuid.v4(),
      userId: userId,
      amount: double.tryParse(amount) ?? 0.0,
      type: type,
      category: category,
      note: description,
      date: transactionDate,
      currency: currency,
      isRecurring: false,
      receiptUrl: paymentData.transactionId,
    );

    final data = tx.toMap();
    data['id'] = tx.id;
    await _db.set('$_basePath/${tx.id}', data);

    return tx;
  }
}