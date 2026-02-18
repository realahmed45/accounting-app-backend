# 🚀 Quick Setup Instructions

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Open `.env` file and add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/accounting-app
```

3. Generate a secure JWT secret (or use this command):

```bash
# On Windows PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or just use a long random string (at least 32 characters)
```

4. Set up Cloudinary (for photo uploads):
   - Sign up at https://cloudinary.com (free tier available)
   - Get your credentials from Dashboard
   - Add to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Step 3: Start the Backend Server

Development mode (with auto-restart):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start at: `http://localhost:5000`

## Step 4: Test the Server

Open browser or Postman and visit:

```
http://localhost:5000/health
```

You should see:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Step 5: Register First User

Using Postman, cURL, or Thunder Client:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "yourpassword",
  "firstName": "Your",
  "familyName": "Name"
}
```

## Step 6: Frontend Setup (Next)

Once backend is running, you'll need to update the frontend to connect to this API.

---

## 📝 Important Notes

### MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/atlas
2. Create a new cluster (free tier M0)
3. Create database user with password
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string and replace `<password>` with your database user password

### JWT_SECRET

- Must be at least 32 characters
- Use random alphanumeric characters
- Keep it secret and secure
- Different for development and production

### Cloudinary Setup

1. Sign up at https://cloudinary.com
2. Free tier gives you:
   - 25GB storage
   - 25GB bandwidth/month
   - Perfect for this app!
3. Dashboard shows all credentials you need

---

## ✅ Verification Checklist

- [ ] Node.js installed (v16+)
- [ ] MongoDB Atlas account created
- [ ] Database cluster created
- [ ] Database user created with password
- [ ] IP whitelisted in MongoDB Atlas
- [ ] Cloudinary account created
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Backend server starts without errors (`npm run dev`)
- [ ] Health check endpoint returns success

---

## 🐛 Troubleshooting

### Server won't start

- Check if MongoDB URI is correct
- Ensure all required env variables are set
- Check if port 5000 is available

### Database connection errors

- Verify MongoDB Atlas IP whitelist
- Check database user credentials
- Ensure connection string format is correct

### Photo upload errors

- Verify Cloudinary credentials
- Check if cloud name is correct
- Ensure API key and secret are valid

---

## 🎯 Next Steps

1. Test all API endpoints with Postman
2. Create your first account
3. Add some categories and people
4. Test expense creation
5. Move to frontend integration

**The backend is fully functional and ready to use! 🎉**
