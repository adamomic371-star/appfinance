import 'dart:convert';
import 'package:flutter/services.dart';

class RawNotification {
  final String packageName;
  final String title;
  final String text;
  final int postTime;
  final String tag;
  final int id;

  RawNotification({
    required this.packageName,
    required this.title,
    required this.text,
    required this.postTime,
    this.tag = '',
    this.id = 0,
  });

  factory RawNotification.fromJson(String json) {
    final map = jsonDecode(json) as Map<String, dynamic>;
    return RawNotification(
      packageName: map['packageName'] ?? '',
      title: map['title'] ?? '',
      text: map['text'] ?? '',
      postTime: map['postTime'] ?? 0,
      tag: map['tag'] ?? '',
      id: map['id'] ?? 0,
    );
  }
}

class NotificationService {
  static const _eventChannel = EventChannel('com.axiom.finance/notifications');
  static const _methodChannel = MethodChannel('com.axiom.finance/notification_actions');

  static Stream<RawNotification> get notificationStream {
    return _eventChannel
        .receiveBroadcastStream()
        .map((data) => RawNotification.fromJson(data as String));
  }

  static Future<bool> isListening() async {
    try {
      return await _methodChannel.invokeMethod('isListening') ?? false;
    } catch (_) {
      return false;
    }
  }
}
