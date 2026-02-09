# PRO Vercel Deployment Guide for InvestHub

This guide details the exact steps to deploy your Next.js application to Vercel correctly and professionally.

## 1. Prerequisites check

Before deploying, ensure:
- Your project builds locally without errors (Run `npm run build` to verify).
- You have a GitHub/GitLab/Bitbucket repository with your latest code pushed.
- You have a MongoDB Atlas cluster (production ready) properly secured.

## 2. Environment Variables Configuration

This is the most critical step. Vercel needs these secrets to run your app.

Go to **Vercel Dashboard** -> **Select Project** -> **Settings** -> **Environment Variables** and add the following:

### Database
- `MONGODB_URI`: Your production MongoDB connection string.
  - *Format*: `mongodb+srv://<username>:<password>@cluster0.o1g4q.mongodb.net/investhub?retryWrites=true&w=majority`
  - *Tip*: Ensure you whitelist `0.0.0.0/0` in MongoDB Atlas Network Access so Vercel's dynamic IPs can connect.

### Authentication (NextAuth.js)
- `NEXTAUTH_URL`: The URL of your deployed app.
  - *Format*: `https://your-project-name.vercel.app` (You can update this after first deployment if the URL changes).
  - *Note*: For Vercel Preview deployments, Vercel automatically sets `VERCEL_URL`, but setting `NEXTAUTH_URL` is safer for production.
- `NEXTAUTH_SECRET`: A strong, random string used to encrypt session tokens.
  - *Generate one*: Run `openssl rand -base64 32` in terminal or use an online generator.

### Payment Gateway (Razorpay)
- `RAZORPAY_KEY_ID`: Your **Live** Key ID from Razorpay Dashboard.
- `RAZORPAY_KEY_SECRET`: Your **Live** Key Secret.
  - *Important*: Do NOT use Test keys for the production deployment unless you are strictly testing.

### Storage (Cloudinary/S3 if applicable)
- `CLOUDINARY_CLOUD_NAME`: (If using Cloudinary for images)
- `CLOUDINARY_API_KEY`: ...
- `CLOUDINARY_API_SECRET`: ...

### Email (Nodemailer/SMTP)
- `SMTP_HOST`: e.g., `smtp.gmail.com`
- `SMTP_PORT`: `465` (SSL) or `587` (TLS)
- `SMTP_USER`: `rushil.ikkasa@gmail.com`
- `SMTP_PASS`: Your generic App Password (not your personal Gmail password).
- `SMTP_FROM`: `InvestHub <rushil.ikkasa@gmail.com>`

## 3. Project Configuration (vercel.json)

Ideally, Next.js requires zero configuration, but for a "Pro" setup, ensure you don't have conflicting static generation issues.

If you have a `vercel.json` file, ensure it's correct. If not, Vercel defaults are usually best for Next.js.
However, verify your `package.json` scripts:
```json
"scripts": {
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

## 4. Deployment Steps

1.  **Import Project**:
    - Log in to Vercel.
    - Click **"Add New..."** -> **"Project"**.
    - Import your Git repository.

2.  **Configure Project**:
    - **Framework Preset**: Vercel should auto-detect "Next.js".
    - **Root Directory**: `INVESTHUB` (Since your project seems to be in a subdirectory `c:\INVESTHUB\INVESTHUB`).
      - *Note*: If your `package.json` is inside the `INVESTHUB` folder, you MUST set the Root Directory to `INVESTHUB`.

3.  **Deploy**:
    - Click **Deploy**.
    - Watch the build logs. If it fails, check the logs—it's usually an Env Var missing or a Type Error (which we just fixed!).
    - Wait for the "Congratulations!" screen.

## 5. Post-Deployment Checks

Once deployed:
1.  **Verify Auth**: Try logging in as Admin and User. If it fails/redirects repeatedly, check `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.
2.  **Verify DB Connection**: Check data loading on the dashboard.
3.  **Test Payments**: Initiate a *small* test transaction if using Live keys.
4.  **Check Logs**: Go to Vercel Dashboard -> **Logs** to catch any runtime errors that didn't stop the build but might break features (like API timeouts).

## 6. Domain Setup (Optional but Pro)

- Go to **Settings** -> **Domains**.
- Add your custom domain (e.g., `www.investhub.com`).
- Follow the DNS instructions (usually adding an A record or CNAME).

---

**Common "Gotchas":**
- **Cold Starts**: Serverless functions can be slow on first hit. This is normal.
- **Timeouts**: Vercel Pro has higher timeout limits than Hobby. Heavy API routes (like complex report generation) might time out on Hobby tier (10s limit).
- **MongoDB Access**: 99% of "Connection failed" errors are due to MongoDB Atlas Network Access not allowing Vercel's IP.

You are now ready to ship! 🚀
