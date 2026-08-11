/**
 * Wallet helpers — EIP-1193 (MetaMask/Rabby/Coinbase) & Solana (Phantom).
 * Tidak ada dependency eksternal: cukup window.ethereum / window.solana.
 */

export const shorten = (a, n = 4) =>
  a ? `${a.slice(0, 2 + n)}\u2026${a.slice(-n)}` : ''

export function hasEthereum() {
  return typeof window !== 'undefined' && Boolean(window.ethereum)
}

export function hasSolana() {
  return typeof window !== 'undefined' && Boolean(window.solana?.isPhantom)
}

export async function connectEthereum() {
  if (!hasEthereum()) {
    throw new Error('No EVM wallet detected. Install MetaMask or Rabby.')
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const address = accounts?.[0]
  if (!address) throw new Error('Wallet returned no account.')
  let chainId = null
  try {
    chainId = await window.ethereum.request({ method: 'eth_chainId' })
  } catch {}
  return { address, chain: 'ethereum', chainId }
}

export async function connectSolana() {
  if (!hasSolana()) throw new Error('No Solana wallet detected. Install Phantom.')
  const res = await window.solana.connect()
  return { address: res.publicKey.toString(), chain: 'solana', chainId: 'mainnet-beta' }
}

/** Minta signature untuk membuktikan kepemilikan address (SIWE-style message). */
export async function signStatement(address, chain, statement) {
  const nonce = crypto.getRandomValues(new Uint32Array(2)).join('')
  const issuedAt = new Date().toISOString()
  const domain = window.location.host
  const message =
    `${domain} wants you to sign in with your ${chain === 'solana' ? 'Solana' : 'Ethereum'} account:\n` +
    `${address}\n\n${statement}\n\n` +
    `URI: ${window.location.origin}\nVersion: 1\nNonce: ${nonce}\nIssued At: ${issuedAt}`

  if (chain === 'solana') {
    const encoded = new TextEncoder().encode(message)
    const signed = await window.solana.signMessage(encoded, 'utf8')
    const sig = btoa(String.fromCharCode(...new Uint8Array(signed.signature)))
    return { message, signature: sig, nonce, issuedAt }
  }

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, address]
  })
  return { message, signature, nonce, issuedAt }
}

export function onAccountsChanged(cb) {
  if (!hasEthereum() || !window.ethereum.on) return () => {}
  const handler = (accounts) => cb(accounts?.[0] ?? null)
  window.ethereum.on('accountsChanged', handler)
  return () => window.ethereum.removeListener?.('accountsChanged', handler)
}
