export interface Balance {
  asset: string
  free: number
  locked: number
  usdValue?: number
}

export interface Deposit {
  id: string
  coin: string
  amount: number
  network: string
  status: string
  insertTime: number
  txId: string
  confirmTimes?: string
}

export interface WithdrawRequest {
  coin: string
  network: string
  address: string
  addressTag?: string
  amount: number
}

export interface WithdrawResponse {
  id: string
  status: string
  message?: string
}

export interface ApiKeyCapabilities {
  canRead: boolean
  canWithdraw: boolean
  error?: string
}

export interface PriceData {
  [symbol: string]: number
}
