# Postman Collection

Import this collection into Postman to test the API endpoints.

## Setup

1. Open Postman
2. Click "Import"
3. Paste the JSON below
4. Set environment variables:
   - `base_url`: http://localhost:3000
   - `auth_token`: (obtained from login)
   - `action_key`: your_withdraw_action_key

## Collection

\`\`\`json
{
  "info": {
    "name": "Binance Dashboard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"password\": \"your_password\"}"
            },
            "url": {
              "raw": "{{base_url}}/api/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "login"]
            }
          }
        },
        {
          "name": "Check Auth",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/auth/check",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "check"]
            }
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "url": {
              "raw": "{{base_url}}/api/auth/logout",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "logout"]
            }
          }
        }
      ]
    },
    {
      "name": "Account",
      "item": [
        {
          "name": "Get Balances",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/account/balances",
              "host": ["{{base_url}}"],
              "path": ["api", "account", "balances"]
            }
          }
        },
        {
          "name": "Get Deposits",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/account/deposits?coin=BTC",
              "host": ["{{base_url}}"],
              "path": ["api", "account", "deposits"],
              "query": [
                {
                  "key": "coin",
                  "value": "BTC"
                }
              ]
            }
          }
        },
        {
          "name": "Get Activity",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/account/activity",
              "host": ["{{base_url}}"],
              "path": ["api", "account", "activity"]
            }
          }
        },
        {
          "name": "Estimate Fee",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"coin\": \"BTC\", \"amount\": 0.1}"
            },
            "url": {
              "raw": "{{base_url}}/api/account/estimate-fee",
              "host": ["{{base_url}}"],
              "path": ["api", "account", "estimate-fee"]
            }
          }
        }
      ]
    },
    {
      "name": "Withdrawals",
      "item": [
        {
          "name": "Initiate Withdrawal",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "X-API-ACTION-KEY",
                "value": "{{action_key}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"coin\": \"BTC\", \"network\": \"BTC\", \"address\": \"1A1z7agoat7sTKfKz87zr57YzxS1L8SyP1\", \"amount\": 0.001}"
            },
            "url": {
              "raw": "{{base_url}}/api/account/withdraw",
              "host": ["{{base_url}}"],
              "path": ["api", "account", "withdraw"]
            }
          }
        }
      ]
    },
    {
      "name": "Admin",
      "item": [
        {
          "name": "Validate API Key",
          "request": {
            "method": "POST",
            "url": {
              "raw": "{{base_url}}/api/admin/validate-key",
              "host": ["{{base_url}}"],
              "path": ["api", "admin", "validate-key"]
            }
          }
        }
      ]
    }
  ]
}
\`\`\`
