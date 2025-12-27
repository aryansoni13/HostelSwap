# Firebase Admin SDK Setup Guide

## Problem
The backend is getting this error:
```
Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started
```

This happens because Firebase Admin SDK needs service account credentials to access Firestore.

## Solution: Set Up Service Account

### Step 1: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **hostelswap-729ab**
3. Click the **gear icon** (⚙️) next to "Project Overview"
4. Select **Project Settings**
5. Go to the **Service Accounts** tab
6. Click **Generate New Private Key**
7. Click **Generate Key** in the dialog
8. A JSON file will be downloaded

### Step 2: Add Service Account Key to Backend

**Option A: Save as file (Recommended for development)**

1. Rename the downloaded file to `serviceAccountKey.json`
2. Move it to the `backend/` directory
3. Add to `.gitignore` (already done):
   ```
   serviceAccountKey.json
   ```

**Option B: Use environment variable**

1. Open the downloaded JSON file
2. Copy the entire contents
3. In your `backend/.env` file, add:
   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"hostelswap-729ab",...}'
   ```
   (Paste the entire JSON as a single-line string)

**Option C: Use file path**

1. Save the JSON file anywhere on your system
2. In your `backend/.env` file, add:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=C:/path/to/your/serviceAccountKey.json
   ```

### Step 3: Restart Backend Server

After adding the service account, restart your backend server:
```bash
cd backend
npm start
```

## Verification

You should see one of these messages when the server starts:
- ✅ `Firebase Admin initialized with service account file`
- ✅ `Firebase Admin initialized with service account from env`
- ✅ `Firebase Admin initialized with default service account file`

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `serviceAccountKey.json` to Git (already in `.gitignore`)
- Never share your service account key publicly
- For production, use environment variables or secure secret management
- The service account key has full access to your Firebase project

## Troubleshooting

**Error: "Cannot find module './serviceAccountKey.json'"**
- Make sure the file is in the `backend/` directory
- Check the file name is exactly `serviceAccountKey.json`

**Error: "Invalid service account"**
- Make sure the JSON file is valid
- Check that you copied the entire JSON content

**Still getting credential errors?**
- Verify the service account key is for the correct project (`hostelswap-729ab`)
- Make sure the file path is correct if using `FIREBASE_SERVICE_ACCOUNT_PATH`
- Check that environment variables are loaded (restart server after adding to `.env`)

