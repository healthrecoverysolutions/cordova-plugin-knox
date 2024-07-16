package com.hrs.knox

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import timber.log.Timber

class RebootTimeoutReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        Timber.d("onReceive intent: Reboot Device")
        val rebootIntent = Intent("REBOOT")
        if (context != null) {
            LocalBroadcastManager.getInstance(context).sendBroadcast(rebootIntent)
        }
    }
}
