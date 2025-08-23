import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = "AIzaSyA9KwoHjc3HX620M5UHY0nN4WtPdukNH_I";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export default async function compareCloudinaryImages(
  storedImageUrl: string, 
  uploadedImageUrl: string
): Promise<boolean> {
  try {
    console.log("Starting image comparison...");
    console.log("Stored image URL:", storedImageUrl);
    console.log("Uploaded image URL:", uploadedImageUrl);

    const [storedImageBase64, uploadedImageBase64] = await Promise.all([
      fetchCloudinaryImageAsBase64(storedImageUrl),
      fetchCloudinaryImageAsBase64(uploadedImageUrl)
    ]);

    console.log("Images fetched successfully");

    const prompt = `
    Compare these two face images and determine if they show the same person:
    
    IMPORTANT: Focus on:
    - Facial bone structure
    - Eye shape and spacing
    - Nose shape and size
    - Mouth and jaw line
    - Unique facial features
    
    Ignore:
    - Lighting differences
    - Image quality
    - Background
    - Clothing
    - Facial expressions
    - Minor angle differences
    
    Respond with only:
    - "MATCH" if they are the same person
    - "NO_MATCH" if they are different people
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: storedImageBase64
              }
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: uploadedImageBase64
              }
            }
          ]
        }
      ]
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || '';
    console.log("AI Response:", text);
    console.log("Full response:", JSON.stringify(response, null, 2));
    
    return text === "MATCH";
  } catch (error) {
    console.error("Cloudinary image comparison error:", error);
    return false;
  }
}

// Browser-compatible helper function
async function fetchCloudinaryImageAsBase64(cloudinaryUrl: string): Promise<string> {
  try {
    const response = await fetch(cloudinaryUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching Cloudinary image:", error);
    throw error;
  }
}