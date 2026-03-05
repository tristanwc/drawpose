const base = import.meta.env.VITE_API_URL ?? ''
export const apiUrl = (path: string) => `${base}/api${path}`
