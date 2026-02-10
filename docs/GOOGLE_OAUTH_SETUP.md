# Google OAuth 2.0 Setup Guide for Vercel Deployment

This guide corrects the "OAuth 2.0 policy" error by adding your deployed Vercel domain to Google Cloud Console.

## 1. Go to Google Cloud Console
1.  Navigate to [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
2.  Make sure you have selected the project that contains your Client ID (`560303774933-...`).
3.  Under **"OAuth 2.0 Client IDs"**, click the pencil icon (Edit) next to your Web client.

## 2. Add Your Vercel Domain

Scroll down to the **"Authorized JavaScript origins"** section and click **"ADD URI"**.
Paste this exact value:
```
https://investhub-three.vercel.app
```
*(Start with `https://` and do not include a trailing slash)*

## 3. Add Your Redirect URI (Critical Step)

Scroll down to the **"Authorized redirect URIs"** section and click **"ADD URI"**.
Paste this exact value:
```
https://investhub-three.vercel.app/api/auth/callback/google
```
*(This must match exactly what Google showed in the error message)*

Click **SAVE**.
*Note: Changes may verify instantly or take a few minutes to propagate.*

## 4. Update Vercel Environment Variables

Go to your **Vercel Dashboard -> Settings -> Environment Variables**.
Ensure `NEXTAUTH_URL` is set to your production domain:

- **Key**: `NEXTAUTH_URL`
- **Value**: `https://investhub-three.vercel.app`

*(Redeploy your project if you change any environment variables in Vercel)*
