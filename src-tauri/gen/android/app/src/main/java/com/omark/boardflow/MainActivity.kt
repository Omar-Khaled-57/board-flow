package com.omark.boardflow

import android.content.ContentValues
import android.content.Context
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import androidx.activity.enableEdgeToEdge
import java.io.File
import java.io.FileInputStream

class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
    }

    companion object {
        @JvmStatic
        fun saveToDownloads(ctx: Context, cachePath: String, filename: String): Boolean {
            return try {
                val file = File(cachePath)
                if (!file.exists()) return false

                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, filename)
                    put(MediaStore.Downloads.MIME_TYPE, "application/json")
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }

                val uri = ctx.contentResolver.insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI, values
                ) ?: return false

                ctx.contentResolver.openOutputStream(uri)?.use { outputStream ->
                    FileInputStream(file).use { inputStream ->
                        inputStream.copyTo(outputStream)
                    }
                } ?: return false

                val updateValues = ContentValues().apply {
                    put(MediaStore.Downloads.IS_PENDING, 0)
                }
                ctx.contentResolver.update(uri, updateValues, null, null)
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
    }
}
