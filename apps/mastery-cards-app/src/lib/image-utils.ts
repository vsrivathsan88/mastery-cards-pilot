/**
 * Image Utilities
 * Convert images to base64 for Gemini Live API
 */

/**
 * Fetch an image and convert it to base64 data URL
 * @param imageUrl - URL of the image (relative or absolute)
 * @returns Promise with { data: base64String, mimeType: string }
 */
export async function imageToBase64(imageUrl: string): Promise<{
  data: string;
  mimeType: string;
}> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Get the blob
    const blob = await response.blob();
    
    // Determine mime type
    const mimeType = blob.type || 'image/png';
    
    // Convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64String.split(',')[1];
        resolve({ data: base64Data, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[imageToBase64] Error converting image:', error);
    throw error;
  }
}
