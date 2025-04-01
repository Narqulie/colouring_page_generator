const API_BASE = '/api'  // Simple, absolute path

export const checkHealth = async () => {
    const response = await fetch(`/health`)  // No undefined!
    // ...
}

export const getImages = async () => {
    const response = await fetch(`${API_BASE}/images`)  // Use /api prefix
    // ...
} 