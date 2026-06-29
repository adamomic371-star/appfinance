package com.axiom.finance

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    companion object {
        var notificationEventSink: EventChannel.EventSink? = null
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        val messenger = flutterEngine.dartExecutor.binaryMessenger

        EventChannel(messenger, "com.axiom.finance/notifications").setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    notificationEventSink = events
                }

                override fun onCancel(arguments: Any?) {
                    notificationEventSink = null
                }
            }
        )

        MethodChannel(messenger, "com.axiom.finance/notification_actions").setMethodCallHandler { call, result ->
            when (call.method) {
                "isListening" -> result.success(true)
                else -> result.notImplemented()
            }
        }
    }
}
