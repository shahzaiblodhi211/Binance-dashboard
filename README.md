# Binance Dashboard Proxy

A secure, production-ready web application for viewing your Binance account balances, deposit history, and managing withdrawals through a web interface.

## Features

- 🔐 **Secure API Proxy**: All Binance API calls are server-side only. Your API secret never reaches the browser.
- 💰 **Balance Overview**: View all non-zero balances with real-time USD conversion
- 📊 **Deposit History**: Track all deposits with filtering by coin and date range
- 💸 **Withdrawal Management**: Initiate withdrawals with two-step confirmation (when enabled)
- 🛡️ **Security First**: Rate limiting, action key validation, comprehensive error handling
- 🧪 **Mock Mode**: Test locally without real Binance credentials
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Binance account with API credentials (optional for mock mode)

### Local Development (Mock Mode)

\`\`\`bash
# Clone and setup
git clone <repo-url>
cd binance-dashboard-proxy

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run development server
npm run dev
\`\`\`

Visit `http://localhost:3000` and use mock data to explore the dashboard.

### With Real Binance API

#### Step 1: Create Binance API Key

1. Log in to your Binance account
2. Go to **Account** → **API Management**
3. Create a new API key with these permissions:
   - ✅ Read (for viewing balances and deposits)
   - ✅ Withdraw (optional, only if you want to enable withdrawals)
4. **Important**: Enable IP Whitelist and add your server's IP address
5. Copy your API Key and Secret

#### Step 2: Configure Environment

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your credentials:

\`\`\`env
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
DASHBOARD_PASSWORD=your_secure_password
WITHDRAW_ACTION_KEY=your_long_random_secret_key
USE_MOCK_SERVER=false
\`\`\`

### Regional Configuration

The application supports different Binance regional endpoints. Configure based on your account region:

**For European/Global accounts (default):**
\`\`\`env
BINANCE_API_BASE_URL=https://api.binance.com/api
\`\`\`

**For US accounts:**
\`\`\`env
BINANCE_API_BASE_URL=https://api.binance.us/api
\`\`\`

If you don't set `BINANCE_API_BASE_URL`, it defaults to the European/Global endpoint (`https://api.binance.com/api`).

**Important for European users:**
- Make sure your Binance API key has IP restrictions enabled
- Add your server's IP address to the whitelist in your Binance account settings
- European accounts use the same endpoint as global accounts

#### Step 3: Run the Application

\`\`\`bash
npm install
npm run dev
\`\`\`

## Security Guidelines

### ⚠️ Critical Security Notes

1. **Never commit `.env` file** - It contains your API secret
2. **Treat API keys like passwords** - If compromised, regenerate immediately
3. **Use IP Whitelist** - Restrict your Binance API key to your server's IP only
4. **Enable 2FA** - Add two-factor authentication to your Binance account
5. **Withdrawal Whitelist** - Add withdrawal addresses to your Binance account before testing
6. **Use a Vault** - In production, store secrets in AWS Secrets Manager, HashiCorp Vault, or similar

### Binance API Permissions

For **read-only** access:
- Enable: Read
- Disable: Withdraw

For **read + withdraw** access:
- Enable: Read, Withdraw
- Restrict: IP whitelist to your server only

### Testing Withdrawals

1. Start with **very small amounts** (0.001 BTC or equivalent)
2. **Whitelist the address** in your Binance account first
3. Test on **testnet** if available
4. Monitor the withdrawal in your Binance account

## Deployment

### Docker

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

Build and run:

\`\`\`bash
docker build -t binance-dashboard .
docker run -p 3000:3000 --env-file .env binance-dashboard
\`\`\`

### Environment Variables (Production)

Use your platform's secret management:

- **Vercel**: Settings → Environment Variables
- **AWS**: Secrets Manager
- **GCP**: Secret Manager
- **Docker**: Use `--env-file` or orchestration platform secrets

### Reverse Proxy (Nginx)

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

## API Endpoints

### GET `/api/account/balances`

Returns non-zero balances with USD values.

**Response:**
\`\`\`json
{
  "balances": [
    {
      "asset": "BTC",
      "free": 0.5,
      "locked": 0.1,
      "usdValue": 21500
    }
  ],
  "totalUSD": 21500,
  "timestamp": 1234567890
}
\`\`\`

### GET `/api/account/deposits`

Returns deposit history with optional filtering.

**Query Parameters:**
- `coin` (optional): Filter by coin symbol
- `startTime` (optional): Start timestamp in ms
- `endTime` (optional): End timestamp in ms

**Response:**
\`\`\`json
{
  "deposits": [
    {
      "id": "123456",
      "coin": "BTC",
      "amount": 0.5,
      "network": "BTC",
      "status": "1",
      "insertTime": 1234567890,
      "txId": "0x..."
    }
  ]
}
\`\`\`

### POST `/api/account/withdraw`

Initiates a withdrawal (requires `X-API-ACTION-KEY` header).

**Headers:**
\`\`\`
X-API-ACTION-KEY: your_withdraw_action_key
\`\`\`

**Body:**
\`\`\`json
{
  "coin": "BTC",
  "network": "BTC",
  "address": "1A1z7agoat...",
  "amount": 0.1
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "withdrawal_id_123",
  "status": "success"
}
\`\`\`

## Troubleshooting

### Common Issues

#### 403 Forbidden Error

This is the most common error and usually means your IP address is not whitelisted in Binance.

**Solution:**

1. Go to Binance → Account → API Management
2. Click "Edit restrictions" on your API key
3. Choose one of these options:

**Option A: Whitelist Specific IPs (Most Secure)**
- Add your server's public IP address
- For multiple locations (e.g., Pakistan + US + Europe), add all IPs
- Binance allows up to 30 IP addresses
- Find your IP: https://whatismyipaddress.com/

**Option B: Unrestricted Access (Less Secure)**
- Select "Unrestricted" to access from any IP
- ⚠️ Only use this if you have strong API secret and 2FA enabled
- Good for development or when accessing from multiple dynamic IPs

**For users accessing from multiple countries:**
If you're in Pakistan with a European Binance account and want to access without VPN:
1. Add your Pakistan public IP to the API key whitelist
2. Add any other country IPs you'll use
3. Or use "Unrestricted" mode (less secure but works everywhere)
4. No VPN needed once configured!

#### Timestamp Errors

The application now automatically syncs with Binance server time. If you still see timestamp errors:

1. Ensure your server's system clock is correct
2. Sync time manually:
   \`\`\`bash
   # Linux/Mac
   sudo ntpdate -s time.nist.gov
   
   # Windows
   w32tm /resync
   \`\`\`

#### "Invalid API Key"

- Verify `BINANCE_API_KEY` and `BINANCE_API_SECRET` are correct
- Check that the key hasn't been deleted from Binance
- Ensure the key has "Enable Reading" permission
- Make sure there are no extra spaces in your `.env` file

#### "Withdrawal disabled"

- Check that your API key has Withdraw permission enabled
- Verify the address is whitelisted in your Binance account
- Some regions may have withdrawal restrictions

#### "Network mismatch"

- Ensure the network (e.g., "BTC", "ETH") matches the coin
- Check Binance's supported networks for that coin

#### Rate limit errors

- Wait 1 minute between withdrawal attempts
- Check server logs for detailed error messages

### Detailed Troubleshooting

For comprehensive troubleshooting including error codes, regional access, and security issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Testing

Run the test suite:

\`\`\`bash
npm test
npm run test:watch
\`\`\`

## Development

### Project Structure

\`\`\`
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Login page
│   ├── dashboard/
│   │   └── page.tsx        # Dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── balance-card.tsx
│   ├── deposit-table.tsx
│   ├── withdraw-modal.tsx
│   └── header.tsx
├── lib/
│   ├── types.ts            # TypeScript types
│   ├── rate-limiter.ts     # Rate limiting
│   ├── security.ts         # Security utilities
│   └── binance-client.ts   # Binance API wrapper
├── pages/api/
│   ├── account/
│   │   ├── balances.ts
│   │   ├── deposits.ts
│   │   └── withdraw.ts
│   └── admin/
│       └── validate-key.ts
├── scripts/
│   └── mock-binance.js     # Mock server for testing
└── tests/                  # Test files
\`\`\`

## License

MIT

## Support

For issues or questions:

1. Check the Troubleshooting section
2. Review Binance API documentation: https://binance-docs.github.io/apidocs/
3. Never share your API keys when asking for help

## Disclaimer

This project interacts with the Binance API and real cryptocurrency. Use at your own risk. Always test with small amounts first. The developers are not responsible for any loss of funds.
