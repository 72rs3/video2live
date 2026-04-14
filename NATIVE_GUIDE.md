# Cam2Pic Pro: Native Android 7+ Implementation Guide

This guide explains how to build a native Android APK that uses the Cam2Pic web interface to spoof other applications (like WhatsApp, Tinder, etc.) on **Android 7.0 (Nougat) up to Android 10**.

## 1. Prerequisites
*   **Android Studio** installed on your computer.
*   A basic understanding of how to create a new Android project.
*   An **Android 7.0+ (API 24+)** device or emulator.

## 2. AndroidManifest.xml Configuration (Robust Version)
The "Trick" relies on the `intent-filter`. For Android 7.1.2, we add a high priority and MIME type support to ensure it appears in the menu.

```xml
<activity android:name=".MainActivity"
    android:exported="true"
    android:label="Cam2Pic Spoof">
    <intent-filter android:priority="999">
        <action android:name="android.media.action.IMAGE_CAPTURE" />
        <action android:name="android.media.action.VIDEO_CAPTURE" />
        <category android:name="android.intent.category.DEFAULT" />
        <!-- Some apps filter by data type -->
        <data android:mimeType="image/*" />
        <data android:mimeType="video/*" />
    </intent-filter>
</activity>
```

## 3. TROUBLESHOOTING: Why it's not triggering
If you click "Take Video" and it opens the real camera immediately without asking you, follow these steps:

### A. Clear Defaults (Most Important)
If you previously clicked "Always" for the system camera, Android will never show the menu again until you reset it:
1.  Go to **Settings** > **Apps**.
2.  Find the **Camera** app (the real one).
3.  Tap **Open by default**.
4.  Tap **Clear Defaults**.
5.  Now try again in WhatsApp; the menu should reappear.

### B. The "Web to APK" Problem
If you are still using a "Web to APK" website to make your app, **it will not work**. 
*   Those websites do not allow you to add the `<intent-filter>` code above.
*   Without that code, your app is "invisible" to the system camera requests.
*   You **must** use Android Studio to build the APK.

### C. Activity Exported
Ensure `android:exported="true"` is set in your Manifest. On Android 7+, if this is false, other apps cannot "see" your app to open it.

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

## 6. Median.co (Web-to-APK) Instructions
If you are using **Median.co** (formerly GoNative) to build your APK, follow these exact steps to enable the "Trick":

### A. Custom Android Manifest
In your Median Dashboard, go to **Native Core** > **Android** > **Custom Manifest**. Paste this code:

```xml
<activity android:name="com.gonative.android.MainActivity"
    android:exported="true"
    android:label="Cam2Pic Spoof">
    <intent-filter android:priority="999">
        <action android:name="android.media.action.IMAGE_CAPTURE" />
        <action android:name="android.media.action.VIDEO_CAPTURE" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="image/*" />
        <data android:mimeType="video/*" />
    </intent-filter>
</activity>
```

### B. Permissions
Go to **Permissions** in the Median dashboard and ensure these are checked:
*   **Camera**
*   **Gallery / Photo Library**
*   **Storage Write Access**

### C. Why this works on Median
Median allows you to override the `MainActivity` configuration. By adding the `intent-filter` to their `MainActivity`, you tell the Android system that the Median app can handle camera requests. When you pick a video in the web app, Median's internal bridge will help pass the data back.

## 7. Deployment Steps (Median)
1.  Enter your Vercel URL in Median.
2.  Apply the **Custom Manifest** code above.
3.  Enable **Camera/Gallery** permissions.
4.  Build the APK and install it.
5.  **IMPORTANT:** Clear defaults for your phone's real camera as explained in the Troubleshooting section!
