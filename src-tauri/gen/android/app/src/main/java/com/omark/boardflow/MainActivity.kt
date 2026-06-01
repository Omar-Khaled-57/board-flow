package com.omark.boardflow

import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import androidx.activity.enableEdgeToEdge
import androidx.core.content.ContextCompat
import java.io.File
import java.io.FileInputStream

class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
    }

    companion object {
        @JvmStatic
        fun saveToDownloads(ctx: Context, cachePath: String, filename: String): String {
            return try {
                // Check permission for API < 29 (scoped storage makes it unnecessary on 29+)
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                    val permission = ContextCompat.checkSelfPermission(
                        ctx, android.Manifest.permission.WRITE_EXTERNAL_STORAGE
                    )
                    if (permission != PackageManager.PERMISSION_GRANTED) {
                        return "ERR_PERMISSION_DENIED"
                    }
                }

                val file = File(cachePath)
                if (!file.exists()) {
                    return "ERR_FILE_NOT_FOUND: $cachePath"
                }

                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, filename)
                    put(MediaStore.Downloads.MIME_TYPE, "application/json")
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }

                val uri = ctx.contentResolver.insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI, values
                )

                if (uri == null) {
                    // Fallback: try alternative URI for older devices
                    val altUri = MediaStore.Files.getContentUri("external")
                    val altValues = ContentValues().apply {
                        put(MediaStore.Files.FileColumns.DISPLAY_NAME, filename)
                        put(MediaStore.Files.FileColumns.MIME_TYPE, "application/json")
                        put(MediaStore.Files.FileColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                        put(MediaStore.Files.FileColumns.IS_PENDING, 1)
                    }
                    val fallbackUri = ctx.contentResolver.insert(altUri, altValues)
                        ?: return "ERR_INSERT_FAILED: no writable content URI"
                    writeAndFinalize(ctx, fallbackUri, file)
                    return "OK"
                }

                writeAndFinalize(ctx, uri, file)
                "OK"
            } catch (e: Exception) {
                e.printStackTrace()
                "ERR_EXCEPTION: ${e.message ?: "Unknown error"}"
            }
        }

        private fun writeAndFinalize(ctx: Context, uri: android.net.Uri, file: File) {
            val outputStream = ctx.contentResolver.openOutputStream(uri)
                ?: throw Exception("Failed to open output stream for $uri")
            outputStream.use { out ->
                FileInputStream(file).use { input ->
                    input.copyTo(out)
                }
            }
            ContentValues().apply {
                put(MediaStore.Downloads.IS_PENDING, 0)
            }.let { updateValues ->
                ctx.contentResolver.update(uri, updateValues, null, null)
            }
        }
    }
}
