/**
 * Web3 auth layer.
 *
 * Supabase punya provider "Web3" (Sign in with Ethereum / Solana) di versi terbaru.
 * Karena ketersediaannya bergantung pada plan & versi project, modul ini:
 *  1) mencoba supabase.auth.signInWithWeb3() bila tersedia,
 *  2) kalau tidak, jatuh ke SIWE manual: sign message di wallet lalu simpan sesi lokal
 *     (preview mode) — UI tetap utuh, tinggal ganti verifikasi di server nanti.
 */
import { supabase, hasSupabase } from './supabase'

const LOCAL_KEY = 'obsidian.session'

export function shortAddr(a = '') {
  return a.length > 10 ? `${a.slice(0, 6)}\u2026${a.slice(-4)}` : a
}

export function readLocalSession() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocalSession(s) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(s))
  } catch {}
}

export function clearLocalSession() {
  try {
    localStorage.removeItem(LOCAL_KEY)
  } catch {}
}

function siweMessage(address, nonce) {
  const domain = window.location.host
  const uri = window.location.origin
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to OBSIDIAN Protocol. This request will not trigger a transaction or cost gas.',
    '',
    `URI: ${uri}`,
    'Version: 1',
    'Chain ID: 1',
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`
  ].join('\n')
}

function nonce() {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

export async function connectEthereum() {
  const eth = window.ethereum
  if (!eth) {
    const err = new Error('NO_WALLET')
    err.hint = 'Wallet EVM tidak terdeteksi. Pasang MetaMask / Rabbit / Coinbase Wallet.'
    throw err
  }
  const accounts = await eth.request({ method: 'eth_requestAccounts' })
  const address = accounts?.[0]
  if (!address) throw new Error('NO_ACCOUNT')

  const n = nonce()
  const message = siweMessage(address, n)
  const signature = await eth.request({ method: 'personal_sign', params: [message, address] })

  // 1) Jalur resmi Supabase Web3 (kalau tersedia di project ini)
  if (hasSupabase && typeof supabase.auth.signInWithWeb3 === 'function') {
    try {
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: 'ethereum',
        statement: 'Sign in to OBSIDIAN Protocol',
        message,
        signature
      })
      if (!error && data?.user) {
        return { address, chain: 'ethereum', mode: 'supabase', user: data.user }
      }
    } catch {
      // lanjut ke fallback
    }
  }

  // 2) Fallback preview: sesi lokal ter-tanda-tangan
  const session = { address, chain: 'ethereum', mode: 'local', signature, issuedAt: Date.now() }
  writeLocalSession(session)
  return session
}

export async function connectSolana() {
  const provider = window.solana ?? window.phantom?.solana
  if (!provider?.isPhantom && !provider?.connect) {
    const err = new Error('NO_WALLET')
    err.hint = 'Wallet Solana tidak terdeteksi. Pasang Phantom atau Solflare.'
    throw err
  }
  const res = await provider.connect()
  const address = res?.publicKey?.toString?.() ?? provider.publicKey?.toString?.()
  const message = `OBSIDIAN Protocol sign-in\nAddress: ${address}\nNonce: ${nonce()}`
  const encoded = new TextEncoder().encode(message)
  const signed = await provider.signMessage(encoded, 'utf8')

  if (hasSupabase && typeof supabase.auth.signInWithWeb3 === 'function') {
    try {
      const { data, error } = await supabase.auth.signInWithWeb3({ chain: 'solana', message, signature: signed?.signature })
      if (!error && data?.user) return { address, chain: 'solana', mode: 'supabase', user: data.user }
    } catch {}
  }

  const session = { address, chain: 'solana', mode: 'local', issuedAt: Date.now() }
  writeLocalSession(session)
  return session
}

export async function signInWithEmail(email) {
  if (!hasSupabase) {
    const s = { address: email, chain: 'email', mode: 'local', issuedAt: Date.now() }
    writeLocalSession(s)
    return { ...s, preview: true }
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  })
  if (error) throw error
  return { sent: true, email }
}

export async function signOut() {
  clearLocalSession()
  if (hasSupabase) await supabase.auth.signOut()
}

export async function joinWaitlist({ email, address, chain }) {
  if (!hasSupabase) return { ok: true, preview: true }
  const { error } = await supabase
    .from('waitlist')
    .insert({ email, wallet_address: address ?? null, chain: chain ?? null })
  if (error && error.code !== '23505') throw error
  return { ok: true }
}
