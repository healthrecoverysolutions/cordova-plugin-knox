package com.hrs.knox

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Context.ALARM_SERVICE
import android.content.Context.TELEPHONY_SERVICE
import android.content.Intent
import android.os.Build
import android.telephony.TelephonyManager
import com.android.volley.Request
import com.android.volley.Response
import com.android.volley.toolbox.StringRequest
import com.android.volley.toolbox.Volley
import com.hrs.patient.BuildConfig
import com.samsung.android.knox.custom.CustomDeviceManager
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import timber.log.Timber


private const val KNOX_ENABLED = true
private const val ACTION_IS_ENABLED = "isEnabled"
private const val ACTION_SHUTDOWN = "shutdown"
private const val ACTION_REBOOT = "reboot"
private const val ACTION_GET_VERSION_INFO = "getVersionInfo"
private const val ACTION_GET_IMEI = "getIMEI"
private const val ACTION_ACCESS_KNOXAPI = "authenticateAPI"

private const val KEY_KNOX_APP_VERSION = "knoxAppVersion"
private const val TIME_SPAN_24_HOURS_MS = 4 * 60 * 60 * 1000
private var imei: String = "" // Device IMEI that would be saved after the permissions prompts and directly pulled from Telephony
private var bearerToken: String = "" // token needed for auth; expires and needs to be regenerated
private var deviceId: String = "" // this is different from the IMEI; it's specific to Knox Manage

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
            imei = telephonyManager.imei

            // Calling to authenticate the API after getting teh IMEI the first time so we are set; this may change depending on expiration
            authenticateAPI();

            Timber.v("Retrieved IMEI: '$imei'")
            callbackContext.success(imei)
        } catch (ex: Exception) {
            val errorMessage = "Failed to fetch IMEI: ${ex.message}"
            Timber.e(errorMessage, ex)
            callbackContext.error(errorMessage)
        }
    }

    // This is not implemented in monorepo yet b/c we didn't use it anymore in PCKS; there is a ticket for product to decide on this
    // https://healthrecoverysolutions.atlassian.net/browse/DEV-11229
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
        val context = cordova.context
        val url = "https://us02.manage.samsungknox.com/emm/oapi/mdm/commonOTCServiceWrapper/sendDeviceControlForRebootDevice"
        val requestQueue = Volley.newRequestQueue(context)

        val stringRequest = object: StringRequest(Request.Method.POST, url,
            Response.Listener<String> { response ->
                Timber.v("Reboot with Knox Manage API Response: '$response'")
            },
            Response.ErrorListener { error ->
                Timber.e("Reboot with Knox Manage API Response Error", error);
            }) {
            override fun getHeaders(): MutableMap<String, String> {
                val headers = HashMap<String, String>()
                headers["cache-control"] = "no-cache"
                headers["content-type"] = "application/x-www-form-urlencoded"
                headers["Authorization"] = "bearer $bearerToken"
                return headers
            }

            // DeviceID != IMEI
            override fun getParams(): MutableMap<String, String> {
                val params = HashMap<String, String>()
                params["deviceId"] = deviceId
                return params
            }
        }

        requestQueue.add(stringRequest)
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

    private fun authenticateAPI() {
        try {
            val context = cordova.context
            Timber.d("Authenticating Knox Manage API")
            val url =
                "https://us02.manage.samsungknox.com/emm/oauth/token?grant_type=client_credentials&client_id=healthrecoverysolutions@development.healthrecoverysolutions.com&client_secret=HRSistheBest123!"
            val requestQueue = Volley.newRequestQueue(context)
            val stringRequest = object : StringRequest(
                Method.POST, url,
                Response.Listener { response ->
                    Timber.v("Authenticating Knox Manage API response: $response")
                    try {
                        val responseObject = JSONObject(response)
                        bearerToken = responseObject["access_token"].toString()

                        // Getting device ID and passing along authentication
                        if (deviceId == "") {
                            getDeviceId()
                        }
                    } catch (e: JSONException) {
                        e.printStackTrace()
                    }

                },
                Response.ErrorListener { error ->
                    Timber.e("Authenticating Knox Manage API response error", error);
                }) {
            }

            requestQueue!!.add(stringRequest)
        } catch (ex: SecurityException) {
            val errorMessage = "Failed to authenticate Knox Manage API: $ex"
            Timber.e(errorMessage, ex)
        }
    }

    // This is not the IMEI but it is used throughout the Knox Manage API
    private fun getDeviceId() {
        try {
            val context = cordova.context
            Timber.d("Getting DeviceId Knox Manage API")
            val url = "https://us02.manage.samsungknox.com/emm/oapi/device/selectDeviceInfoByImei"
            val requestQueue = Volley.newRequestQueue(context)

            val stringRequest = object : StringRequest(
                Method.POST, url,
                Response.Listener { response ->
                    Timber.v("Getting DeviceId Knox Manage API Response: '$response'")
                    val responseObject = JSONObject(response)
                    val resultValue = responseObject.getJSONObject("resultValue")
                    deviceId = resultValue.getString("deviceId")
                },
                Response.ErrorListener { error ->
                    Timber.e("Getting DeviceId Knox Manage API Response Error", error);
                }) {
                override fun getHeaders(): MutableMap<String, String> {
                    val headers = HashMap<String, String>()
                    headers["cache-control"] = "no-cache"
                    headers["content-type"] = "application/x-www-form-urlencoded"
                    headers["Authorization"] = "bearer $bearerToken"
                    return headers
                }
                override fun getParams(): MutableMap<String, String> {
                    val params = HashMap<String, String>()
                    params["imei"] = imei
                    return params
                }
            }

            requestQueue.add(stringRequest)
        } catch (ex: SecurityException) {
            val errorMessage = "Failed to get DeviceID from the Knox Manage API: $ex"
            Timber.e(errorMessage, ex)
        }
    }
}

