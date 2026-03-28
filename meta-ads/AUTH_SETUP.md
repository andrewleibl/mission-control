# Meta API Authentication Setup

## Overview
To give Apollo live access to Hector's Meta Ads data, you need to create a Meta App and generate an access token.

## Step 1: Create Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** app type
4. Fill in:
   - **App Name:** `Straight Point Marketing - Apollo`
   - **App Contact Email:** `andrew@straightpointmarketing.com`
   - **Business Manager Account:** Select Hector's Business (3912495572386412)
5. Click **Create App**
6. Skip the "What do you want your app to do?" screen for now

## Step 2: Add Marketing API Product

1. In your new app dashboard, click **"Add Product"**
2. Find **"Marketing API"** and click **Set Up**
3. This enables the ads_read and ads_management permissions

## Step 3: Configure OAuth

1. Go to **Settings** → **Basic**
2. Note your **App ID** and **App Secret** (you'll need these)
3. Go to **Settings** → **Advanced**
4. Under **Security**, set **"Require App Secret Proof for Server API calls"** to **No** (for easier testing)

## Step 4: Get Access Token

### Option A: Graph API Explorer (Fastest for testing)

1. Go to [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. Select your new app from the dropdown
3. Click **"Generate Access Token"**
4. Grant permissions:
   - ✅ `ads_read`
   - ✅ `ads_management`
   - ✅ `business_management` (to access Hector's Business Manager)
5. Copy the **Access Token** (starts with `EA...`)

### Option B: System User Token (Production)

For automated, non-expiring access:

1. In [business.facebook.com](https://business.facebook.com), go to **Settings** → **System Users**
2. Click **Add** → Create a system user named "Apollo"
3. Assign **Admin** role
4. Generate a token with `ads_read`, `ads_management` permissions
5. This token doesn't expire

## Step 5: Grant Hector's Business Access

1. In [business.facebook.com](https://business.facebook.com), switch to Hector's Business
2. Go to **Settings** → **Partners**
3. Click **Add** → **Give a Partner Access to Your Assets**
4. Enter your app's **Business ID** (from Step 2)
5. Assign:
   - **Ad Account:** 1999744500951711 → Role: **Admin**
   - **Business:** Role: **Employee**

## Step 6: Test Connection

Once you have the token, I'll test the connection:

```javascript
const connector = new MetaAdsConnector({
  accessToken: "YOUR_TOKEN_HERE",
  adAccountId: "1999744500951711"
});

await connector.testConnection();
// Should output: ✅ Connected to: Valley of the Sun Landscape (Status: 1)
```

## Token Security

⚠️ **Never commit the access token to git.**

Store it in:
- `~/.openclaw/meta-ads/.env` (already in .gitignore)
- Or OpenClaw's credential store

## Next Steps

1. Complete steps 1-5 above
2. Send me the access token
3. I'll configure Apollo and test live data pulling
4. Once working, repeat steps 5-6 for PJ and Ricardo

**Estimated time:** 10-15 minutes
