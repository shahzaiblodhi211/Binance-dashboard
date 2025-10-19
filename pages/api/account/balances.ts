import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import crypto from "crypto";

interface Balance {
  asset: string;
  free: number;
  locked: number;
  usdValue: number;
  walletAddress?: string;
  network?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = "yNQjNVQM2gW3qoLcoLQ8Lo5zD4W1G9I0BzW8ZTBSphDG5zIz8HhVELz3LuIoVzXd";
    const secretKey = "K5HZBQ4pVh0T9so95fXC1i3ILHHSioSvvo09SXyjmieUp7IAfLJ9yEqATIPhwsFo";

    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = crypto.createHmac("sha256", secretKey).update(query).digest("hex");

    // 1️⃣ Fetch account balances
    const accountRes = await axios.get(
      `https://api.binance.com/api/v3/account?${query}&signature=${signature}`,
      { headers: { "X-MBX-APIKEY": apiKey }, timeout: 20000 }
    );

    const balancesRaw = accountRes.data.balances.filter(
      (b: { free: string; locked: string }) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );

    // 2️⃣ Fetch prices for USD conversion
    const pricesRes = await axios.get("https://api.binance.com/api/v3/ticker/price", { timeout: 10000 });
    const prices: Record<string, string> = {};
    for (const p of pricesRes.data) {
      if (p.symbol && p.price) prices[p.symbol] = p.price;
    }

    // 3️⃣ Construct balances with static TRC20 wallet for USDT
    const balances: Balance[] = balancesRaw.map((b: any) => {
      const free = parseFloat(b.free);
      const locked = parseFloat(b.locked);
      const usdValue =
        b.asset === "USDT"
          ? free + locked
          : (free + locked) * parseFloat(prices[`${b.asset}USDT`] || "0");

      let walletAddress: string | undefined;
      let network: string | undefined;

      if (b.asset === "USDT") {
        walletAddress = "TGWpGJcZmvWfNhLtteKgJnyU67S3UWi1UW"; // 🟢 Your fixed TRC20 wallet
        network = "TRC20";
      }

      return {
        asset: b.asset,
        free,
        locked,
        usdValue,
        walletAddress,
        network,
      };
    });

    const totalUSD = balances.reduce((sum, b) => sum + b.usdValue, 0);

    return res.status(200).json({
      balances,
      totalUSD,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Binance API error:", error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data || error.message });
  }
}
