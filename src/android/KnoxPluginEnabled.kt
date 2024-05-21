package com.hrs.knox

import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.json.JSONArray
import org.json.JSONObject
import timber.log.Timber
import com.samsung.android.knox.custom.CustomDeviceManager
import com.samsung.android.knox.EnterpriseDeviceManager
import android.telephony.TelephonyManager
import android.content.Context.TELEPHONY_SERVICE

private const val KNOX_ENABLED = true
private const val ACTION_IS_ENABLED = "isEnabled"
private const val ACTION_SHUTDOWN = "shutdown"
private const val ACTION_REBOOT = "reboot"
private const val ACTION_GET_VERSION_INFO = "getVersionInfo"
private const val KEY_KNOX_APP_VERSION = "knoxAppVersion"
private const val ACTION_GET_IMEI = "getIMEI";

class KnoxPlugin : CordovaPlugin() {

	override fun pluginInitialize() {
		super.pluginInitialize()
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

			ACTION_SHUTDOWN -> {
				cordova.threadPool.execute {
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
						Timber.e(errorMessage, ex)
						callbackContext.error(errorMessage)
					}
				}
			}

			ACTION_REBOOT -> {
				cordova.threadPool.execute {
					try {
						val edm = EnterpriseDeviceManager.getInstance(cordova.context)
                        val passwordPolicy = edm.passwordPolicy
						passwordPolicy.reboot(null)
						callbackContext.success()
					} catch (ex: Exception) {
						val errorMessage = "Failed to reboot device"
						Timber.e(errorMessage, ex)
						callbackContext.error(errorMessage)
					}
				}
			}

            ACTION_GET_VERSION_INFO -> {
                cordova.threadPool.execute {
                    try {
                        val context = cordova.context
						val edm = EnterpriseDeviceManager.getInstance(context)
						val applicationPolicy = edm.applicationPolicy
						val knoxAppVersion = applicationPolicy.getApplicationVersion(context.packageName)
                        val result = JSONObject()
                            .put(KEY_KNOX_APP_VERSION, knoxAppVersion)
                        callbackContext.success(result)
                    } catch (ex: Exception) {
                        val errorMessage = "Failed to fetch version info: ${ex.message}"
                        Timber.e(errorMessage, ex)
                        callbackContext.error(errorMessage)
                    }
                }
            }

			ACTION_GET_IMEI -> {
				cordova.threadPool.execute {
					try {
						val context = cordova.context
						val telephonyManager = context.getSystemService(TELEPHONY_SERVICE) as TelephonyManager
						val imei = telephonyManager.getImei()
						Timber.v("Retrieved IMEI: '$imei'")
						callbackContext.success(imei)
					} catch (ex: Exception) {
						val errorMessage = "Failed to fetch IMEI: ${ex.message}"
						Timber.e(errorMessage, ex)
						callbackContext.error(errorMessage)
					}
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
}
