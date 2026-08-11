/**
 * Wallet helpers — EIP-1193 (MetaMask/Rabby/Coinbase) dan Phantom (Solana).
 * Tidak ada dependency wallet-kit, jadi bundle tetap ringan.
 */

export function shortAddr(a = '', head = 6, tail = 4) {
  if (!a) return ''
  return a.length <= head + tail + 2 ? a : `${a.slice(0, head)}\u2026${a.slice(-tail)}`
}

export function detectWallets() {
  if (typeof window === 'undefined') return { evm: false, solana: false }
  return {
    evm: Boolean(window.ethereum),
    solana: Boolean(window.solana && window.solana.isPhantom)
  }
}

export async function connectEvm() {
  const provider = typeof window !== 'undefined' ? window.ethereum : null
  if (!provider) {
    const err = new Error('Tidak ada wallet EVM terdeteksi. Pasang MetaMask atau Rabby lalu muat ulang halaman.')
    err.code = 'NO_PROVIDER'
    throw err
  }
  const accounts = await provider.request({ method: 'eth_requestAccounts' })
  const address = accounts && accounts[0]
  if (!address) throw new Error('Wallet tidak mengembalikan alamat apa pun.')

  let chainId = null
  try {
    chainId = await provider.request({ method: 'eth_chainId' })
  } catch {
    /* opsional */
  }

  return { address, chain: 'ethereum', chainId, provider }
}

export async function signEvmMessage(provider, address, message) {
  return provider.request({ method: 'personal_sign', params: [message, address] })
}

export async function connectSolana() {
  const provider = typeof window !== 'undefined' ? window.solana : null
  if (!provider || !provider.isPhantom) {
    const err = new Error('Phantom tidak terdeteksi. Pasang ekstensi Phantom lalu muat ulang halaman.')
    err.code = 'NO_PROVIDER'
    throw err
  }
  const res = await provider.connect()
  return { address: res.publicKey.toString(), chain: 'solana', provider }
}

/** Pesan SIWE-style yang ditandatangani user. */
export function buildStatement(address, chain) {
  const nonce = Math.random().toString(36).slice(2, 12)
  const host = typeof window !== 'undefined' ? window.location.host : 'obsidian.protocol'
  return [
    `${host} meminta kamu menandatangani pesan untuk masuk.`,
    '',
    `Address: ${address}`,
    `Chain: ${chain}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
    '',
    'Tanda tangan ini gratis dan tidak memindahkan aset apa pun.'
  ].join('\n')
}
