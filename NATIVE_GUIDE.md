# Cam2Pic Pro: Native Android 7+ Implementation Guide

This guide explains how to build a native Android APK that uses the Cam2Pic web interface to spoof other applications (like WhatsApp, Tinder, etc.) on **Android 7.0 (Nougat) up to Android 10**.

## 1. Prerequisites
*   **Android Studio** installed on your computer.
*   A basic understanding of how to create a new Android project.
*   An **Android 7.0+ (API 24+)** device or emulator.

## 2. AndroidManifest.xml Configuration
The "Trick" relies on the `intent-filter`. Additionally, for Android 7+, you **must** declare a `FileProvider` to share files securely.

```xml
<manifest ...>
    <application ...>
        <activity android:name=".MainActivity"
            android:exported="true">
            <intent-filter android:label="Cam2Pic Spoof">
                <action android:name="android.media.action.IMAGE_CAPTURE" />
                <action android:name="android.media.action.VIDEO_CAPTURE" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>

        <!-- CRITICAL FOR ANDROID 7+ -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
```

## 3. Create res/xml/file_paths.xml
Create a new file at `app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="my_images" path="." />
    <cache-path name="my_cache" path="." />
</paths>
```

## 4. MainActivity.java Logic (The Bridge)
For Android 7+, we use `FileProvider` to generate a secure `content://` URI instead of a `file://` URI.

```java
import android.content.Intent;
import android.net.Uri;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import java.io.File;

public class MainActivity extends AppCompatActivity {
    
    // ... WebView setup ...

    public void returnMediaToSystem(String filePath) {
        File file = new File(filePath);
        Uri contentUri = FileProvider.getUriForFile(this, 
                getApplicationContext().getPackageName() + ".fileprovider", file);

        Intent result = new Intent();
        
        // If the calling app provided an EXTRA_OUTPUT (common in Android 7+)
        Uri outputUri = getIntent().getParcelableExtra(MediaStore.EXTRA_OUTPUT);
        if (outputUri != null) {
            // Copy your gallery file to the outputUri provided by the system
            copyFile(contentUri, outputUri);
        } else {
            result.setData(contentUri);
        }

        result.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        setResult(RESULT_OK, result);
        finish();
    }
}
```

## 5. Why Android 7+ is different
Starting with Android 7.0, the system blocks `file://` URIs for security. If you don't use the `FileProvider` logic above, the app you are trying to spoof will crash or show a "File not found" error.

## 6. Deployment Steps
1.  Create a project in **Android Studio**.
2.  Add the `intent-filter` and `provider` to the Manifest.
3.  Create the `file_paths.xml` file.
4.  Update `MainActivity.java` with the `FileProvider` logic.
5.  Build and install on your device.
