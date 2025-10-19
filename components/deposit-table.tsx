"use client"

import { useState } from "react"
import useSWR from "swr"
import { ExternalLink } from "lucide-react"
import type { Deposit } from "@/lib/types"

interface DepositsResponse {
  deposits: Deposit[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DepositTable() {
  const [selectedCoin, setSelectedCoin] = useState("")
  const { data, error, isLoading } = useSWR<DepositsResponse>(
    `/api/account/deposits${selectedCoin ? `?coin=${selectedCoin}` : ""}`,
    fetcher,
  )

const getNetworkExplorerUrl = (network: string, txId: string): string => {
  const explorers: Record<string, string> = {
    BTC: "https://www.blockchain.com/btc/tx/",
    ETH: "https://etherscan.io/tx/",
    BSC: "https://bscscan.com/tx/",
    POLYGON: "https://polygonscan.com/tx/",
    ADA: "https://explorer.cardano.org/en/transaction/",
    SOL: "https://explorer.solana.com/tx/",
    DOT: "https://polkadot.subscan.io/extrinsic/",
    LTC: "https://blockchair.com/litecoin/transaction/",
    XRP: "https://xrpscan.com/tx/",
    DOGE: "https://dogechain.info/tx/",
    BCH: "https://blockchair.com/bitcoin-cash/transaction/",
    TRX: "https://tronscan.org/#/transaction/",
    AVAX: "https://explorer.avax.network/tx/",
    NEAR: "https://explorer.near.org/transactions/",
    QRL: "https://explorer.theqrl.org/tx/",
    USDT_ETH: "https://etherscan.io/tx/",
    USDT_TRON: "https://tronscan.org/#/transaction/",
    USDT_BSC: "https://bscscan.com/tx/",
    USDT_POLYGON: "https://polygonscan.com/tx/",
    ALGO: "https://algoexplorer.io/tx/",
    FTM: "https://ftmscan.com/tx/",
    MATIC: "https://polygonscan.com/tx/",
    HNT: "https://explorer.helium.com/tx/",
    NEAR: "https://explorer.near.org/transactions/",
    ATOM: "https://cosmos.bigdipper.live/transactions/",
    LTC: "https://blockchair.com/litecoin/transaction/",
    EOS: "https://bloks.io/transaction/",
    XLM: "https://stellar.expert/explorer/public/tx/",
    ZEC: "https://explorer.zcha.in/transactions/",
    BCH: "https://blockchair.com/bitcoin-cash/transaction/",
    DOGE: "https://dogechain.info/tx/",
    LTC: "https://blockchair.com/litecoin/transaction/",
    TRX: "https://tronscan.org/#/transaction/",
    AVAX: "https://explorer.avax.network/tx/",
    NEAR: "https://explorer.near.org/transactions/",
    QRL: "https://explorer.theqrl.org/tx/",
  };

  return (explorers[network] || "") + txId;
};


  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

const coins =
  data?.deposits?.map((d) => d.coin).filter((v, i, a) => a.indexOf(v) === i) || []


  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Deposit History</h2>

      {error && (
        <div className="bg-danger/10 border border-danger rounded-lg p-4 text-danger text-sm mb-4">
          Failed to load deposit history.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-background rounded animate-pulse"></div>
          ))}
        </div>
      ) : data && data.deposits.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 font-semibold text-text-secondary">Date</th>
                <th className="text-left py-3 px-3 font-semibold text-text-secondary">Coin</th>
                <th className="text-right py-3 px-3 font-semibold text-text-secondary">Amount</th>
                <th className="text-left py-3 px-3 font-semibold text-text-secondary">Network</th>
                <th className="text-left py-3 px-3 font-semibold text-text-secondary">Status</th>
                <th className="text-center py-3 px-3 font-semibold text-text-secondary">TX</th>
              </tr>
            </thead>
            <tbody>
              {data.deposits.map((deposit) => (
                <tr key={deposit.id} className="border-b border-border hover:bg-background transition-colors">
                  <td className="py-3 px-3">{formatDate(deposit.insertTime)}</td>
                  <td className="py-3 px-3 font-semibold">{deposit.coin}</td>
                  <td className="py-3 px-3 text-right">{deposit.amount.toFixed(8)}</td>
                  <td className="py-3 px-3 text-xs text-text-secondary">{deposit.network}</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-1 bg-success/10 text-success rounded text-xs font-medium">
                      {deposit.status === "Completed" ? "Completed" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {deposit.txId && (
                      <a
                        href={getNetworkExplorerUrl(deposit.network, deposit.txId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-white hover:text-white-dark transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          <p>No deposits found</p>
        </div>
      )}
    </div>
  )
}
