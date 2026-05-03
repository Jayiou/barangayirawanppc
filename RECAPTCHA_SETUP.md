# Google reCaptcha v3 Setup Guide

reCaptcha v3 has been integrated into the registration form to protect against automated bot registrations. Unlike reCaptcha v2, v3 is invisible to users and works seamlessly in the background.

## How reCaptcha v3 Works

- **Invisible**: No checkbox or challenge for users
- **Score-based**: Returns a score from 0.0 to 1.0
  - 1.0 = Very likely a human
  - 0.0 = Very likely a bot
- **Threshold**: Registrations with scores below 0.5 are rejected

## Setup Steps

### 1. Create a Google reCaptcha v3 Project

1. Go to [Google reCaptcha Admin Console](https://www.google.com/recaptcha/admin)
2. Sign in with a Google account
3. Click **Create** to add a new project
4. Fill in the form:
   - **Label**: "Barangay Irawan" (or your choice)
   - **reCaptcha type**: Select **reCaptcha v3**
   - **Domains**: Add your domains (e.g., `localhost`, `yourdomain.com`)
5. Accept the reCaptcha Terms of Service
6. Click **Create**

### 2. Get Your Keys

After creating the project, you'll see:
- **Site Key** (public): Used in frontend
- **Secret Key** (private): Used in backend

### 3. Update Your Environment File

Create or update your `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/barangay_db
JWT_SECRET=your-secret-key

# Google reCaptcha v3
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

Replace:
- `your_site_key_here` with your actual Site Key
- `your_secret_key_here` with your actual Secret Key

### 4. Update Frontend Site Key

Update the reCaptcha script in `frontend/index.html`:

```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

Replace `YOUR_SITE_KEY` with your actual Site Key.

Also update the site key in `frontend/src/pages/LandingApp.vue` in the `registerResident` function:

```javascript
const recaptchaToken = await window.grecaptcha.execute('YOUR_SITE_KEY', { action: 'register' });
```

## How It Works

### Registration Flow

1. **User submits registration form**
2. **Frontend collects reCaptcha token** via `window.grecaptcha.execute()`
3. **Token sent with registration data** to backend
4. **Backend verifies token** with Google's servers
5. **Score checked**: If < 0.5, registration is rejected
6. **Approval/rejection**: User is notified

### Error Handling

- **"reCaptcha verification failed"**: The token couldn't be verified
- **"Suspicious activity detected"**: The score was too low (< 0.5)
- **reCaptcha service unavailable**: Google's service is temporarily down

## Testing

### Test Keys (Optional)

Google provides test keys for development:
- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

These keys will always return a score of 1.0 (human) in testing. Use them for local development.

### Production Setup

For production:
1. Create a separate reCaptcha project in Google Console
2. Add your production domains (e.g., `yourdomain.com`)
3. Use the production keys in `.env`
4. Monitor the reCaptcha Admin Console for bot detection patterns

## Monitoring

Visit the [reCaptcha Admin Console](https://www.google.com/recaptcha/admin) to:
- View registration analytics
- Track bot detection rates
- Adjust thresholds if needed
- Monitor suspicious activity

## Troubleshooting

### "grecaptcha is not defined"
- Ensure the reCaptcha script is loaded in `index.html`
- Check browser console for script loading errors
- Verify the Site Key is correct

### All registrations rejected
- Check the reCaptcha score threshold (currently 0.5)
- Verify the Secret Key is correct in `.env`
- Check Google reCaptcha Admin Console for errors

### Token expired
- Tokens expire after 2 minutes
- Ensure registration is submitted immediately after form completion
- Users can refresh and retry if token expires

## Score Interpretation

- **0.9-1.0**: Legitimate human, high confidence
- **0.5-0.8**: Likely human, some suspicious behavior
- **0.1-0.4**: Suspicious activity, likely bot
- **0.0-0.1**: Almost certainly a bot

Adjust the threshold (currently 0.5) in `authController.js` if needed:

```javascript
if (data.score < 0.5) {  // Change 0.5 to your preferred threshold
    throw createHttpError(400, 'Suspicious activity detected...');
}
```

## References

- [Google reCaptcha Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCaptcha Admin Console](https://www.google.com/recaptcha/admin)
- [reCaptcha API Reference](https://developers.google.com/recaptcha/docs/verify)
