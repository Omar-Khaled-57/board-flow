use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
pub async fn save_to_downloads(
    app: tauri::AppHandle,
    filename: String,
    data: String,
) -> Result<String, String> {
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    let temp_path = cache_dir.join(&filename);

    fs::write(&temp_path, &data).map_err(|e| e.to_string())?;

    let result = save_impl(&app, &temp_path, &filename);
    let _ = fs::remove_file(&temp_path);
    result
}

#[cfg(target_os = "android")]
fn save_impl(
    app: &tauri::AppHandle,
    temp_path: &PathBuf,
    filename: &str,
) -> Result<String, String> {
    copy_to_downloads_android(app, temp_path, filename)
}

#[cfg(not(target_os = "android"))]
fn save_impl(
    app: &tauri::AppHandle,
    temp_path: &PathBuf,
    filename: &str,
) -> Result<String, String> {
    if let Some(download_dir) = app.path().download_dir().ok() {
        let dest_path = download_dir.join(filename);
        if fs::copy(temp_path, &dest_path).is_ok() {
            return Ok(filename.to_string());
        }
    }
    Err("Failed to save file to Downloads.".to_string())
}

#[cfg(target_os = "android")]
fn copy_to_downloads_android(
    _app: &tauri::AppHandle,
    temp_path: &PathBuf,
    filename: &str,
) -> Result<String, String> {
    use jni::objects::{JClass, JObject, JValue};
    use jni::JavaVM;

    let android_ctx = ndk_context::android_context();
    let jvm = unsafe { JavaVM::from_raw(android_ctx.vm() as *mut jni::sys::JavaVM) }
        .map_err(|e| format!("JavaVM creation failed: {}", e))?;
    let mut env = jvm.attach_current_thread()
        .map_err(|e| format!("attach_current_thread failed: {}", e))?;

    let activity = unsafe { JObject::from_raw(android_ctx.context() as jni::sys::jobject) };

    let context: JObject<'_> = env
        .call_method(
            &activity,
            "getApplicationContext",
            "()Landroid/content/Context;",
            &[],
        )
        .map_err(|e| format!("getApplicationContext failed: {}", e))?
        .l()
        .map_err(|e| format!("extract context object failed: {}", e))?;

    let cache_path_str = temp_path.to_string_lossy().to_string();
    let j_cache_path = env
        .new_string(&cache_path_str)
        .map_err(|e| e.to_string())?;
    let j_filename = env.new_string(filename).map_err(|e| e.to_string())?;

    // Load MainActivity via the context's ClassLoader instead of find_class,
    // because FindClass from a native thread uses the system class loader
    // which cannot find app-specific classes.
    let class_loader = env
        .call_method(
            &context,
            "getClassLoader",
            "()Ljava/lang/ClassLoader;",
            &[],
        )
        .map_err(|e| format!("getClassLoader failed: {}", e))?
        .l()
        .map_err(|e| format!("extract classLoader failed: {}", e))?;

    let j_class_name = env
        .new_string("com.omark.boardflow.MainActivity")
        .map_err(|e| e.to_string())?;

    let class_obj = env
        .call_method(
            &class_loader,
            "loadClass",
            "(Ljava/lang/String;)Ljava/lang/Class;",
            &[JValue::Object(&j_class_name.into())],
        )
        .map_err(|e| format!("loadClass failed: {}", e))?
        .l()
        .map_err(|e| format!("extract class failed: {}", e))?;

    // Convert JObject to JClass (JClass is a newtype wrapper around JObject)
    let class: JClass<'_> = (&class_obj).into();

    // The Kotlin method now returns a String: "OK" on success, "ERR_*" on failure
    let result_obj = env
        .call_static_method(
            &class,
            "saveToDownloads",
            "(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;",
            &[
                JValue::Object(&context),
                JValue::Object(&j_cache_path),
                JValue::Object(&j_filename),
            ],
        )
        .map_err(|e| format!("call_static_method failed: {}", e))?
        .l()
        .map_err(|e| format!("extract result string failed: {}", e))?;

    let result_jstr: jni::objects::JString<'_> = result_obj.into();
    let result_java_str = env
        .get_string(&result_jstr)
        .map_err(|e| format!("get_string failed: {}", e))?;
    let result_str = result_java_str.to_string();

    if result_str == "OK" {
        Ok(filename.to_string())
    } else if result_str == "ERR_PERMISSION_DENIED" {
        Err("Storage permission denied. Please grant storage permission in Android settings.".to_string())
    } else {
        Err(format!("Export failed: {}", result_str))
    }
}
