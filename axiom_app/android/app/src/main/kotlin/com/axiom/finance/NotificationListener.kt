package com.axiom.finance

import android.app.Notification
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import org.json.JSONObject

class NotificationListener : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName == packageName) return

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return

        val title = extras.getString(Notification.EXTRA_TITLE)?.trim() ?: ""
        val text = extras.getString(Notification.EXTRA_TEXT)
            ?: extras.getString(Notification.EXTRA_BIG_TEXT)
            ?: extras.getString(Notification.EXTRA_SUB_TEXT)
            ?: return

        if (title.isEmpty() && text.isEmpty()) return

        val data = JSONObject().apply {
            put("packageName", sbn.packageName)
            put("title", title)
            put("text", text.trim())
            put("postTime", sbn.postTime)
            put("tag", sbn.tag ?: "")
            put("id", sbn.id)
        }

        MainActivity.notificationEventSink?.success(data.toString())
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {}

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i("AxiomNL", "Notification listener connected")
    }
}
