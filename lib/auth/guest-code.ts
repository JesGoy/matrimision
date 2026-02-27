const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes)
    .map((value) => CODE_ALPHABET[value % CODE_ALPHABET.length])
    .join("")
}

export async function generateUniqueGuestCode(
  exists: (code: string) => Promise<boolean>,
  length = 6
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomCode(length)
    const inUse = await exists(code)
    if (!inUse) {
      return code
    }
  }

  throw new Error("Unable to generate a unique guest code")
}
