/**
 * Adapter dompet browser — tanpa dependency wallet SDK.
 * Ethereum: EIP-1193 (MetaMask, Rabby, Brave, dsb) + personal_sign
 * Solana: window.solana (Phantom) + signMessage
 */

export function detectWallets() {
  const eth = typeof window !== 'undefined' && window.ethereum
  const sol = typeof window !== 'undefined' && (window.solana || window.phantom?.solana)
  return {
    ethereum: Boolean(eth),
    solana: Boolean(sol && sol.isPhantom !== false)
  }
}

export function shortAddress(a, head = 6, tail = 4) {
  if (!a) return ''
  return `${a.slice(0, head)}\u2026${a.slice(-tail)}`
}

function nonce() {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/** Pesan gaya EIP-4361 (Sign-In with Ethereum). */
export function buildSiweMessage({ address, chainId = 1, statement }) {
  const domain = window.location.host
  const uri = window.location.origin
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    statement || 'Sign in to OBSIDIAN Protocol. This request will not trigger a transaction or cost gas.',
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce()}`,
    `Issued At: ${new Date().toISOString()}`
  ].join('\n')
}

export async function connectEthereum() {
  const provider = window.ethereum
  if (!provider) throw new Error('Dompet Ethereum tidak terdeteksi. Pasang MetaMask atau Rabby.')

  const accounts = await provider.request({ method: 'eth_requestAccounts' })
  const address = accounts?.[0]
  if (!address) throw new Error('Tidak ada akun yang dipilih.')

  const chainIdHex = await provider.request({ method: 'eth_chainId' })
  const chainId = parseInt(chainIdHex, 16)

  const message = buildSiweMessage({ address, chainId })
  const signature = await provider.request({
    method: 'personal_sign',
    params: [message, address]
  })

  return { chain: 'ethereum', address, chainId, message, signature }
}

export async function connectSolana() {
  const provider = window.solana || window.phantom?.solana
  if (!provider) throw new Error('Dompet Solana tidak terdeteksi. Pasang Phantom.')

  const res = await provider.connect()
  const address = res?.publicKey?.toString() || provider.publicKey?.toString()
  if (!address) throw new Error('Tidak ada akun yang dipilih.')

  const message = [
    `${window.location.host} wants you to sign in with your Solana account:`,
    address,
    '',
    'Sign in to OBSIDIAN Protocol. This request will not trigger a transaction.',
    '',
    `Nonce: ${nonce()}`,
    `Issued At: ${new Date().toISOString()}`
  ].join('\n')

  const encoded = new TextEncoder().encode(message)
  const signed = await provider.signMessage(encoded, 'utf8')
  const signature = btoa(String.fromCharCode(...new Uint8Array(signed.signature)))

  return { chain: 'solana', address, message, signature }
}
