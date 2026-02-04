# SSL Certificates Directory

This directory will store SSL certificates for local testing. In production, certificates are managed by Let's Encrypt and stored in `/etc/letsencrypt/`.

## Production SSL Setup

SSL certificates are automatically obtained and renewed using Certbot. See the deployment README for setup instructions.

## Local Development

For local HTTPS testing, you can generate self-signed certificates:

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nginx-selfsigned.key \
  -out ssl/nginx-selfsigned.crt \
  -subj "/C=HK/ST=Hong Kong/L=Hong Kong/O=Looper HQ/CN=localhost"
```

## Production Certificates

In production, Certbot stores certificates at:
- Certificate: `/etc/letsencrypt/live/your-domain.com/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/your-domain.com/privkey.pem`

These are mounted into the Nginx container via docker-compose.prod.yml.

## Security Notes

- Never commit private keys (*.key, *.pem files) to version control
- Self-signed certificates are for development only
- Production must use valid SSL certificates from Let's Encrypt or commercial CA
