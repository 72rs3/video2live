# Cam2Pic Pro: Native Android 10 Implementation Guide

This guide explains how to build a native Android APK that uses the Cam2Pic web interface to spoof other applications (like WhatsApp, Tinder, etc.) on Android 10 and lower.

## 1. Prerequisites
*   **Android Studio** installed on your computer.
*   A basic understanding of how to create a new Android project.
*   An **Android 10 (API 29)** device or emulator.

## 2. AndroidManifest.xml Configuration
The "Trick" relies on the `intent-filter`. This tells Android that your app is a camera.

```xml
<activity android:name=".MainActivity"
    android:exported="true">
    <intent-filter android:label="Cam2Pic Spoof">
        <action android:name="android.media.action.IMAGE_CAPTURE" />
        <action android:name="android.media.action.VIDEO_CAPTURE" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</activity>
```

## 3. MainActivity.java Logic
You need to detect when the app is opened by an "Intent" and then return the selected video to the calling app.

```java
import android.content.Intent;
import android.net.Uri;
import android.provider.MediaStore;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        
        // Detect Intent
        Intent intent = getIntent();
        String url = "https://YOUR_VERCEL_URL.vercel.app";
        
        if (MediaStore.ACTION_IMAGE_CAPTURE.equals(intent.getAction()) || 
            MediaStore.ACTION_VIDEO_CAPTURE.equals(intent.getAction())) {
            // Open web app in "Intent Mode"
            url += "?intent=capture&auto=true";
        }
        
        webView.loadUrl(url);
    }

    // This method would be called via a Javascript Interface 
    // when the user clicks "SEND_TO_SYSTEM" in the web app
    public void returnMediaToSystem(String fileUri) {
        Uri uri = Uri.parse(fileUri);
        Intent result = new Intent();
        result.setData(uri);
        setResult(RESULT_OK, result);
        finish();
    }
}
```

## 4. Why your previous APK failed
Your previous "Web to APK" converter did not include the `intent-filter` in the Manifest. Without that, Android thinks your app is just a website and will never show it in the "Complete action using..." menu.

## 5. Deployment Steps
1.  Create a new project in **Android Studio**.
2.  Add a **WebView** to your layout.
3.  Copy the `intent-filter` into your `AndroidManifest.xml`.
4.  Update the `MainActivity.java` with the logic above.
5.  Build the APK and install it on your Android 10 device.
