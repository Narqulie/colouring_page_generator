const API_BASE = '/api'  // Simple, absolute path

// Define types for our responses
interface HealthResponse {
    status: string;
    version: string;
    timestamp: string;
}

interface ImagesResponse {
    images: string[];
}

// Add proper error handling and response parsing
export const checkHealth = async (): Promise<HealthResponse> => {
    const response = await fetch('/health')
    if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`)
    }
    return response.json()
}

export const getImages = async (): Promise<ImagesResponse> => {
    const response = await fetch(`${API_BASE}/images`)
    if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`)
    }
    return response.json()
}

// Add other API calls with proper types
export const generateImage = async (
    prompt: string, 
    language: string = 'en',
    complexity: string = 'medium',
    theme: string = 'none'
): Promise<{ image_path: string }> => {
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('language', language)
    formData.append('complexity', complexity)
    formData.append('theme', theme)

    const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        body: formData
    })
    
    if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.statusText}`)
    }
    
    return response.json()
} 