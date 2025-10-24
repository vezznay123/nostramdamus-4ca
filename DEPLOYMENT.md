# Deployment Guide

## Prerequisites

✅ Cloudflare account (you're already logged in!)
✅ D1 database created and initialized
✅ Google Cloud OAuth credentials

## Quick Deployment Checklist

### 1. Google OAuth Setup (5 minutes)

1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Name: "Nostradamus Forecasting"
5. Add Authorized redirect URI:
   - For development: `http://localhost:8787/auth/callback`
   - For production: `https://nostradamus-forecast.YOUR-SUBDOMAIN.workers.dev/auth/callback`
6. Click "Create"
7. Copy the Client ID and Client Secret

### 2. Update wrangler.toml

Edit `wrangler.toml` and update these values:

```toml
[vars]
GOOGLE_CLIENT_ID = "YOUR-CLIENT-ID.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "https://nostradamus-forecast.YOUR-SUBDOMAIN.workers.dev/auth/callback"
```

### 3. Set Secrets

```bash
# Navigate to project directory
cd forecast-workers

# Set Google Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Google Client Secret when prompted

# Set JWT Secret (generate a random string)
wrangler secret put JWT_SECRET
# Enter a secure random string (e.g., openssl rand -base64 32)
```

### 4. Deploy to Production

```bash
wrangler deploy
```

**Output will show your Worker URL**, e.g.:
```
Published nostradamus-forecast (X.XX sec)
  https://nostradamus-forecast.YOUR-SUBDOMAIN.workers.dev
```

### 5. Update Google OAuth Redirect URI

1. Go back to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Add the production redirect URI from step 4
4. Click "Save"

### 6. Test Your Deployment

1. Visit your Worker URL
2. Click "Login with Google"
3. Authorize the application
4. You should be redirected to the dashboard!

## Troubleshooting

### Error: "Redirect URI mismatch"
- Make sure the redirect URI in Google Console exactly matches your Worker URL + `/auth/callback`
- Check that `GOOGLE_REDIRECT_URI` in wrangler.toml matches

### Error: "Unauthorized"
- Check that secrets are set correctly: `wrangler secret list`
- Verify `GOOGLE_CLIENT_SECRET` and `JWT_SECRET` are set

### Error: "Database not found"
- Make sure D1 database is created: `wrangler d1 list`
- Check `database_id` in wrangler.toml matches

### Workers AI not responding
- Workers AI is automatically enabled for paid plans
- Check your account has Workers AI access

## Next Steps After Deployment

1. **Test the complete flow:**
   - Login with Google
   - Load data from Google Sheets or BigQuery
   - Generate a forecast
   - Export results back to Sheets

2. **Set up scheduled forecasting:**
   - Cron triggers are already configured (every 6 hours)
   - They'll run automatically once you have projects configured

3. **Monitor your Worker:**
   ```bash
   wrangler tail
   ```

4. **View logs:**
   - Go to Cloudflare Dashboard → Workers & Pages → nostradamus-forecast → Logs

## Cost Estimation

With Cloudflare Workers Paid plan ($5/month):

- **Workers**: Included in plan (10M requests/month)
- **D1**: ~$0.50/month (100k reads, 1k writes per day)
- **Workers AI**: Included (generous free tier)
- **R2** (optional): ~$0.15/month

**Total: ~$5.65/month** for a production-grade forecasting platform with zero cold starts!

## Optional: Enable R2 Storage

If you need R2 for file storage:

1. Go to https://dash.cloudflare.com → R2
2. Click "Purchase R2"
3. Enable R2
4. Run: `wrangler r2 bucket create nostradamus-data`

## Support

For issues:
- Check wrangler logs: `wrangler tail`
- Review D1 data: `wrangler d1 execute nostradamus-db --command "SELECT * FROM users"`
- Check GitHub issues in main repo

## Success Criteria

✅ Worker deployed and accessible
✅ OAuth login working
✅ Can load data from Google Sheets
✅ Can generate forecasts with Workers AI
✅ Can export results back to Sheets
✅ No cold starts!

---

**You're all set!** The Cloudflare Workers app is now running with zero cold starts, built-in scheduling, and Workers AI forecasting. 🎉
