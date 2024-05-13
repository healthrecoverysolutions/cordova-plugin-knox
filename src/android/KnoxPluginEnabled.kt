package com.hrs.knox

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Context.ALARM_SERVICE
import android.content.Intent
import com.samsung.android.knox.EnterpriseDeviceManager
import com.samsung.android.knox.custom.CustomDeviceManager
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.json.JSONArray
import org.json.JSONObject
import timber.log.Timber
import android.telephony.TelephonyManager
import android.content.Context.TELEPHONY_SERVICE
import android.os.Build
import com.hrs.patient.BuildConfig

private const val KNOX_ENABLED = true
private const val ACTION_IS_ENABLED = "isEnabled"
private const val ACTION_SHUTDOWN = "shutdown"
private const val ACTION_REBOOT = "reboot"
private const val ACTION_GET_VERSION_INFO = "getVersionInfo"
private const val ACTION_GET_IMEI = "getIMEI"

private const val KEY_KNOX_APP_VERSION = "knoxAppVersion"
private const val TIME_SPAN_24_HOURS_MS = 4 * 60 * 60 * 1000

class KnoxPlugin : CordovaPlugin() {

    private inner class RebootTimeoutReceiver : BroadcastReceiver() {

        override fun onReceive(context: Context?, intent: Intent?) {
            Timber.d("onReceive intent: Reboot Device")
            performReboot()
        }
    }

    override fun pluginInitialize() {
        super.pluginInitialize()
        startRebootAlarm()
    }

    override fun onPause(multitasking: Boolean) {
        super.onPause(multitasking)
    }

    override fun onStop() {
        super.onStop()
    }

    override fun onDestroy() {
        super.onDestroy()
    }

    override fun execute(
        action: String,
        args: JSONArray,
        callbackContext: CallbackContext
    ): Boolean {
        Timber.v("execute action '$action'")
        when (action) {
            ACTION_IS_ENABLED -> {
                Timber.v("responding with 'true'")
                callbackContext.success(JSONObject().put("enabled", KNOX_ENABLED))
            }

            ACTION_GET_VERSION_INFO -> {
                cordova.threadPool.execute {
                    getVersionInfo(callbackContext)
                }
            }

            ACTION_SHUTDOWN -> {
                cordova.threadPool.execute {
                    shutdown(callbackContext)
                }
            }

            ACTION_REBOOT -> {
                cordova.threadPool.execute {
                    reboot(callbackContext)
                }
            }

            ACTION_GET_IMEI -> {
                cordova.threadPool.execute {
                    getIMEI(callbackContext)
                }
            }

            else -> {
                Timber.w("rejecting unsupported action '$action'")
                callbackContext.error("Action $action is not implemented in KnoxPlugin.")
                return false
            }
        }

        return true
    }

    private fun getVersionInfo(callbackContext: CallbackContext) {
        try {
            val knoxAppVersion = BuildConfig.VERSION_NAME;
            Timber.v("Retrieved AppVersion: '$knoxAppVersion'")
            val result = JSONObject().put(KEY_KNOX_APP_VERSION, knoxAppVersion)
            callbackContext.success(result)
        } catch (ex: Exception) {
            val errorMessage = "Failed to fetch version info: ${ex.message}"
            Timber.e(ex, errorMessage)
            callbackContext.error(errorMessage)
        }
    }

    private fun getIMEI(callbackContext: CallbackContext) {
        try {
            val context = cordova.context
            val telephonyManager = context.getSystemService(TELEPHONY_SERVICE) as TelephonyManager
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                val errorMessage = "Failed to fetch IMEI (minimum version requirement not met - Build.VERSION_CODES.O)"
                Timber.w(errorMessage)
                callbackContext.error(errorMessage)
                return
            }
            val imei = telephonyManager.imei
            Timber.v("Retrieved IMEI: '$imei'")
            callbackContext.success(imei)
        } catch (ex: Exception) {
            val errorMessage = "Failed to fetch IMEI: ${ex.message}"
            Timber.e(errorMessage, ex)
            callbackContext.error(errorMessage)
        }
    }

    private fun shutdown(callbackContext: CallbackContext) {
        try {
            // With Knox SDK 3.x this functionality now requires a premium KPE license for the SDK, which we might not get,
            // so it could throw an exception if we try to use this, but keeping it just in case we do go with that
            // license at some point:
            // java.lang.RuntimeException: Unable to start receiver com.hrs.patientconnectknoxservice.PatientConnectInterface:
            // java.lang.SecurityException: Admin  does not have com.samsung.android.knox.permission.KNOX_CUSTOM_SYSTEM OR
            // com.sec.enterprise.knox.permission.CUSTOM_SYSTEM
            val cdm = CustomDeviceManager.getInstance()
            cdm.systemManager.powerOff()
            callbackContext.success()
        } catch (ex: Exception) {
            val errorMessage = "Failed to power off device"
            Timber.e(ex, errorMessage)
            callbackContext.error(errorMessage)
        }
    }

    private fun reboot(callbackContext: CallbackContext) {
        try {
            performReboot()
            callbackContext.success()
        } catch (ex: Exception) {
            val errorMessage = "Failed to reboot device"
            Timber.e(ex, errorMessage)
            callbackContext.error(errorMessage)
        }
    }

    private fun performReboot() {
        val edm = EnterpriseDeviceManager.getInstance(cordova.context)
        val passwordPolicy = edm.passwordPolicy
        passwordPolicy.reboot(null)
    }

    private fun startRebootAlarm() {
        Timber.d("startRebootAlarm()")

        val context = cordova.context
        val currentTime = System.currentTimeMillis()
        val triggerTime = currentTime + TIME_SPAN_24_HOURS_MS
        val alarmManager = context.getSystemService(ALARM_SERVICE) as AlarmManager
        val alarmIntent = Intent(context, RebootTimeoutReceiver::class.java)

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            alarmIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        try {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
            Timber.d("will reboot at %s (from current time %s)", triggerTime, currentTime)
        } catch (ex: SecurityException) {
            Timber.e(ex, "failed to set reboot alarm due to security exception")
        } catch (ex: Exception) {
            Timber.e(ex, "failed to set reboot alarm due to unknown exception")
        }
    }
}