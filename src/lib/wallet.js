/**
 * Deteksi + koneksi wallet browser tanpa dependency eksternal.
 * EVM  : EIP-1193 (MetaMask, Rabby, Coinbase, Brave...)
 * SOL  : Phantom / Backpack (window.solana)
 */

export function hasEvm() {
  return typeof window !== 'undefined' && Boolean(window.ethereum)
}

export function hasSolana() {
  return typeof window !== 'undefined' && Boolean(window.solana && window.solana.isPhantom !== undefined)
}

export function shortAddress(a) {
  if (!a) return ''
  return a.length > 12 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a
}

export async function connectEvm() {
  if (!hasEvm()) throw new Error('NO_EVM_WALLET')
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const address = accounts && accounts[0]
  if (!address) throw new Error('NO_ACCOUNT')
  return address
}

export async function connectSolana() {
  if (!hasSolana()) throw new Error('NO_SOLANA_WALLET')
  const res = await window.solana.connect()
  return res.publicKey.toString()
}

/** Pesan EIP-4361 (Sign-In with Ethereum) yang valid. */
export function buildSiweMessage(address, nonce) {
  const { host, origin } = window.location
  return [
    `${host} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Authenticate with OBSIDIAN Protocol. This request will not trigger a blockchain transaction or cost any gas.',
    '',
    `URI: ${origin}`,
    'Version: 1',
    'Chain ID: 1',
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`
  ].join('\n')
}

export function makeNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function signEvmMessage(address, message) {
  return window.ethereum.request({
    method: 'personal_sign',
    params: [message, address]
  })
}
