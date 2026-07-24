export function decodeGoogleJwt(credential) {
  if (!credential || typeof credential !== 'string') {
    throw new Error('Missing Google credential')
  }

  const parts = credential.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid Google credential format')
  }

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const json = atob(padded)
  return JSON.parse(json)
}
