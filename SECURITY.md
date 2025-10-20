# Security Guidelines

## API Key Management

### Never Commit Real API Keys

This repository uses `.gitignore` to protect sensitive files. The following patterns are ignored:

- `.env` - Local environment variables
- `.env.local` - Local environment overrides
- `.env.development` - Development environment config
- `.env.test` - Test environment config
- `.env.production` - Production environment config
- `*.key` - Any key files

### Setting Up Environment Variables

1. **Copy the template**: Use `.env.template` files as a starting point
2. **Never commit**: Keep your actual `.env` files local only
3. **Use strong secrets**: Generate random strings for SESSION_SECRET and ENCRYPTION_KEY
4. **Rotate regularly**: Change API keys and secrets periodically

### API Key Best Practices

#### For Development:
```bash
# apps/tutor-app/.env
VITE_GEMINI_API_KEY=<paste-your-actual-key-here>
```

#### For API Server:
```bash
# apps/api-server/.env
GOOGLE_GENERATIVE_AI_API_KEY=<paste-your-actual-key-here>
SESSION_SECRET=<generate-random-32-plus-chars>
ENCRYPTION_KEY=<generate-exactly-32-chars>
```

### Generating Secure Secrets

#### SESSION_SECRET (any length, recommend 32+ chars):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### ENCRYPTION_KEY (exactly 32 characters):
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### What NOT to Commit

❌ Real API keys
❌ Session secrets
❌ Encryption keys
❌ Database passwords
❌ Private certificates
❌ User data or PII

### What IS Safe to Commit

✅ `.env.template` files with placeholder values
✅ Configuration structure and field names
✅ Comments explaining what each variable does
✅ Default non-sensitive values (ports, feature flags, etc.)

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainers directly rather than opening a public issue.

## Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
