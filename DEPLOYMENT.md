# Deployment Guide

This guide covers deploying the Binance Dashboard Proxy to production environments.

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- SSL/TLS certificates (for HTTPS)
- Binance API credentials with appropriate permissions
- A server with at least 512MB RAM and 1GB storage

## Local Development

### Using Mock Data

\`\`\`bash
cp .env.example .env
# Leave BINANCE_API_KEY and BINANCE_API_SECRET empty
echo "USE_MOCK_SERVER=true" >> .env
npm install
npm run dev
\`\`\`

Visit `http://localhost:3000` and use any password to login.

### Using Real Binance API

\`\`\`bash
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
\`\`\`

## Docker Deployment

### Build Image

\`\`\`bash
docker build -t binance-dashboard:latest .
\`\`\`

### Run Container

\`\`\`bash
docker run -d \
  --name binance-dashboard \
  -p 3000:3000 \
  -e BINANCE_API_KEY=your_key \
  -e BINANCE_API_SECRET=your_secret \
  -e DASHBOARD_PASSWORD=your_password \
  -e WITHDRAW_ACTION_KEY=your_action_key \
  -e NODE_ENV=production \
  binance-dashboard:latest
\`\`\`

### Using Docker Compose

\`\`\`bash
# Create .env file with your credentials
cp .env.example .env
# Edit .env with your values

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
\`\`\`

## Kubernetes Deployment

### Create ConfigMap and Secret

\`\`\`bash
kubectl create configmap binance-config \
  --from-literal=NODE_ENV=production \
  --from-literal=DASHBOARD_PASSWORD=your_password

kubectl create secret generic binance-secrets \
  --from-literal=BINANCE_API_KEY=your_key \
  --from-literal=BINANCE_API_SECRET=your_secret \
  --from-literal=WITHDRAW_ACTION_KEY=your_action_key
\`\`\`

### Deploy

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: binance-dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: binance-dashboard
  template:
    metadata:
      labels:
        app: binance-dashboard
    spec:
      containers:
      - name: app
        image: binance-dashboard:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: binance-config
        - secretRef:
            name: binance-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: binance-dashboard
spec:
  selector:
    app: binance-dashboard
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
\`\`\`

## SSL/TLS Setup

### Generate Self-Signed Certificate (Development)

\`\`\`bash
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
\`\`\`

### Using Let's Encrypt (Production)

\`\`\`bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem

# Set permissions
sudo chown 1001:1001 ssl/*
\`\`\`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BINANCE_API_KEY` | Yes | Your Binance API key |
| `BINANCE_API_SECRET` | Yes | Your Binance API secret |
| `DASHBOARD_PASSWORD` | Yes | Password to access dashboard |
| `WITHDRAW_ACTION_KEY` | Yes | Secret key for withdrawal requests |
| `NODE_ENV` | No | Set to `production` for production |
| `USE_MOCK_SERVER` | No | Set to `true` to use mock data |
| `PORT` | No | Port to run on (default: 3000) |

## Security Checklist

- [ ] API key has IP whitelist enabled
- [ ] API key has only necessary permissions (Read + Withdraw if needed)
- [ ] WITHDRAW_ACTION_KEY is a long random string (32+ characters)
- [ ] DASHBOARD_PASSWORD is strong (16+ characters)
- [ ] SSL/TLS certificates are valid and up-to-date
- [ ] Nginx is configured with security headers
- [ ] Rate limiting is enabled
- [ ] Logs are monitored for suspicious activity
- [ ] Regular backups are configured
- [ ] Firewall rules restrict access appropriately

## Monitoring

### Health Check

\`\`\`bash
curl -I https://yourdomain.com/
\`\`\`

### View Logs

\`\`\`bash
# Docker
docker logs -f binance-dashboard

# Docker Compose
docker-compose logs -f app

# Kubernetes
kubectl logs -f deployment/binance-dashboard
\`\`\`

### Metrics

Monitor these metrics:
- Response time
- Error rate
- API rate limit usage
- Memory and CPU usage
- Withdrawal success rate

## Troubleshooting

### Application won't start

1. Check environment variables are set correctly
2. Verify API credentials are valid
3. Check logs for specific errors
4. Ensure port 3000 is not in use

### API calls failing

1. Verify Binance API key is valid
2. Check IP whitelist on Binance account
3. Verify network connectivity
4. Check rate limits haven't been exceeded

### SSL/TLS errors

1. Verify certificate files exist and are readable
2. Check certificate expiration date
3. Ensure certificate matches domain name
4. Verify Nginx configuration is correct

## Backup and Recovery

### Backup Configuration

\`\`\`bash
# Backup environment and certificates
tar -czf backup-$(date +%Y%m%d).tar.gz .env ssl/
\`\`\`

### Recovery

\`\`\`bash
# Restore from backup
tar -xzf backup-20240101.tar.gz
docker-compose up -d
\`\`\`

## Updates and Maintenance

### Update Application

\`\`\`bash
# Pull latest code
git pull origin main

# Rebuild image
docker build -t binance-dashboard:latest .

# Restart container
docker-compose down
docker-compose up -d
\`\`\`

### Database Migrations

This application doesn't use a database, but if you add one:

\`\`\`bash
npm run migrate
docker-compose up -d
\`\`\`

## Support

For issues:
1. Check logs for error messages
2. Review Binance API documentation
3. Verify all environment variables are set
4. Test with mock server first
5. Check firewall and network settings
