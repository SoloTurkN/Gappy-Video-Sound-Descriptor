# 🚀 Production Deployment Configuration

## Environment Setup

### Development Environment (This Workspace)
- **MongoDB**: Local (`mongodb://localhost:27017`)
- **Database**: `test_database`
- **Purpose**: Safe testing, development, experimentation

### Production Environment (describe.gappylabs.com)
- **MongoDB**: MongoDB Atlas Cloud
- **Database**: `gappy_describe`
- **Purpose**: Live user data, stable operations

---

## 📋 Production Environment Variables

When deploying, configure these environment variables in Emergent's deployment settings:

```env
MONGO_URL=mongodb+srv://gappy_admin:H3gZAOJstosJyoCq@cluster0.xw6kwek.mongodb.net/gappy_describe?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=gappy_describe
JWT_SECRET_KEY=zeG43IvpvoMcBFTeEJESMPKVvDrzD43AA_RmqiHsuE0
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-0D9F14c584cC506990
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
ELEVENLABS_API_KEY=sk_bbae26d0d9d0240492cca81fec8dd76dad19d39b02c9b2b1
EMERGENT_AUTH_API=https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data
STRIPE_API_KEY=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
```

⚠️ **IMPORTANT**: For production, replace `sk_test_emergent` with your live Stripe API key from the Stripe Dashboard.

⚠️ **SECURITY NOTE**: Replace `<YOUR_MONGODB_PASSWORD>` with your actual MongoDB password ONLY in the Emergent Deployment Environment Variables panel. Never commit passwords to code or documentation.

---

## 🔐 MongoDB Atlas Credentials

**Cluster**: cluster0.xw6kwek.mongodb.net
**Username**: gappy_admin
**Password**: `<YOUR_MONGODB_PASSWORD>` ⚠️ *Enter securely in deployment settings*
**Database**: gappy_describe

**Connection String Template**:
```
mongodb+srv://gappy_admin:<YOUR_MONGODB_PASSWORD>@cluster0.xw6kwek.mongodb.net/gappy_describe?retryWrites=true&w=majority&appName=Cluster0
```

**🔒 Security Best Practice**: 
- Store the actual password securely (password manager, secure notes)
- Only enter it in the Emergent Deployment Environment Variables panel
- Never commit passwords to code repositories or documentation

---

## 🌐 Domain Configuration

**Production URL**: https://describe.gappylabs.com
**Domain Provider**: GoDaddy

### DNS Setup Steps:
1. After deployment, click "Link domain" in Emergent
2. Enter: `describe.gappylabs.com`
3. Click "Entri" and follow instructions
4. In GoDaddy DNS Management:
   - Remove existing A records for `describe` subdomain
   - Add DNS records provided by Emergent
5. Wait 5-15 minutes for DNS propagation

---

## 🔄 Update Workflow

1. **Make Changes**: Edit code in development environment
2. **Test Locally**: Use local MongoDB, test thoroughly
3. **Preview**: Click Preview button to verify
4. **Deploy**: Click Deploy to push to production
5. **Verify**: Test on describe.gappylabs.com

---

## ⚠️ Important Notes

- **Never test destructive operations in production**
- **Always test locally first** before deploying
- **Development and production databases are separate** for safety
- **Re-deploying updates existing deployment** (no extra cost)
- **Rollback available** if issues occur

---

## 📊 MongoDB Atlas Management

**Access Atlas**: https://cloud.mongodb.com
- View production data
- Monitor database performance
- Manage users and access
- Set up backups (recommended)

---

## 🆘 Emergency Contacts

**MongoDB Atlas Support**: Available in Atlas dashboard
**Emergent Support**: Available through support_agent

---

*Last Updated: December 2025*
