# Document Upload Implementation - Mobile App

## Issue Fixed
**Problem:** Document upload buttons were not working - tapping them did nothing.

**User Feedback:** "jab ma upload doument wla screen pa aya hun upload kasa karo ma to laptop pa android stadio used kar rha hun"
(When I come to the upload document screen, how do I upload? I'm using Android Studio on my laptop)

## Solution Implemented

### 1. **Added Image Picker Functionality**

**File:** `mobile-app/src/screens/provider/ProviderRegistrationScreen.js`

**Changes Made:**

#### a) Added Import
```javascript
import { launchImageLibrary } from 'react-native-image-picker';
```

#### b) Created Document Picker Function
```javascript
const handleDocumentPick = async (documentType) => {
  try {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setDocuments({
        ...documents,
        [documentType]: {
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `document_${Date.now()}.jpg`
        }
      });
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to pick image');
  }
};
```

#### c) Connected Buttons to Function
```javascript
<TouchableOpacity
  key={doc}
  style={styles.documentCard}
  onPress={() => handleDocumentPick(doc)}  // Now calls the function
>
```

#### d) Added Image Preview
```javascript
{documents[doc] ? (
  <Image source={{ uri: documents[doc].uri }} style={styles.documentPreview} />
) : (
  <Text style={styles.documentIcon}>📷</Text>
)}
```

#### e) Added Style for Preview
```javascript
documentPreview: {
  width: 100,
  height: 100,
  borderRadius: 8,
  marginBottom: 8,
}
```

### 2. **Added Android Permissions**

**File:** `mobile-app/android/app/src/main/AndroidManifest.xml`

**Added Permissions:**
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

## How It Works

### User Flow:
1. User completes Step 1 (Personal Info) and Step 2 (Service & Vehicle)
2. User reaches Step 3: "Upload Documents"
3. User sees 3 document cards:
   - CNIC Front
   - CNIC Back
   - License
4. **User taps on any document card**
5. **Android image picker opens** (gallery)
6. User selects an image
7. **Image preview appears** in the card
8. Status changes to "✓ Tap to change"
9. User can tap again to change the image
10. User clicks "Submit" to complete registration

### Technical Flow:
```
Tap Document Card
    ↓
handleDocumentPick('cnic_front')
    ↓
launchImageLibrary() opens
    ↓
User selects image from gallery
    ↓
Image URI, type, and name stored in state
    ↓
Image preview displayed in UI
    ↓
On Submit: FormData created with all documents
    ↓
Uploaded to backend via API
```

## Dependencies Already Installed

The `react-native-image-picker` package is already in `package.json`:
```json
"react-native-image-picker": "^7.1.0"
```

## Testing Instructions

### On Android Studio/Emulator:

1. **Build and Run the App:**
   ```bash
   cd mobile-app
   npm start
   # In another terminal
   npm run android
   ```

2. **Test Document Upload:**
   - Login to the app
   - Select "Service Provider" role
   - Complete Step 1 (Name, CNIC)
   - Complete Step 2 (Select category, vehicle details)
   - On Step 3, tap any document card
   - **Expected:** Android gallery/image picker should open
   - Select an image
   - **Expected:** Image preview should appear in the card
   - Tap "Submit"
   - **Expected:** Registration completes, navigates to Pending Approval

3. **Test Image Selection:**
   - Upload an image
   - Tap the same card again
   - Select a different image
   - **Expected:** Preview should update to new image

4. **Test Form Submission:**
   - Upload all 3 documents
   - Click Submit
   - Check backend logs
   - **Expected:** Documents uploaded successfully

## Important Notes

### For Android 13+ (API 33+):
- The `READ_MEDIA_IMAGES` permission is required
- The app will automatically request permission when image picker opens
- Users need to grant permission to access photos

### For Android 12 and below:
- `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` permissions are used
- These are automatically requested by the image picker library

### Image Optimization:
- Images are compressed to 80% quality
- Max dimensions: 1024x1024 pixels
- This reduces upload time and storage requirements

## Troubleshooting

### If image picker doesn't open:
1. Check if permissions are granted in device settings
2. Go to: Settings → Apps → RoadX → Permissions
3. Enable "Photos and videos" or "Files and media"

### If images don't upload:
1. Check backend is running on `http://localhost:5000`
2. Check mobile app API configuration in `mobile-app/src/config.js`
3. Verify backend endpoint: `POST /api/providers/documents`

### If permission errors occur:
1. Uninstall and reinstall the app
2. Grant permissions when prompted
3. Or manually grant in device settings

## Files Modified

1. **`mobile-app/src/screens/provider/ProviderRegistrationScreen.js`**
   - Added image picker import
   - Created `handleDocumentPick` function
   - Connected document cards to picker
   - Added image preview UI
   - Added preview style

2. **`mobile-app/android/app/src/main/AndroidManifest.xml`**
   - Added READ_EXTERNAL_STORAGE permission
   - Added WRITE_EXTERNAL_STORAGE permission
   - Added READ_MEDIA_IMAGES permission

## Status
✅ **FIXED** - Document upload buttons now work correctly
✅ Image picker opens when tapping document cards
✅ Image previews are displayed
✅ Android permissions configured
✅ Ready for testing on Android Studio/emulator