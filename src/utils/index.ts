// Generate a random nonce string for security purposes
export function getNonce(): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// Convert a string to a URL-friendly slug
export function slugify(text: string): string {
  // Note: This function doesn't lowercase the text because Cody accepts both uppercase and lowercase commands
  return text
    .toString()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars (except hyphens)
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single hyphen
}
