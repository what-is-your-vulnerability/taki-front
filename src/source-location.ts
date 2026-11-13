// UI labels stay compact; exports and copied locations retain the original string.
export function shortSourceLocation(location: string) {
  return location.split(/[\\/]/).pop() || location
}

export async function copySourceLocation(location: string, clipboard?: Pick<Clipboard, 'writeText'>) {
  if (!clipboard) return false
  try { await clipboard.writeText(location); return true }
  catch { return false }
}
