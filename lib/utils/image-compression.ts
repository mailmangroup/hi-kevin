/**
 * Compress an image file to reduce size before upload
 * @param file The image file to compress
 * @param maxSizeMB Maximum size in MB (default 0.5MB)
 * @param maxWidthOrHeight Maximum width or height in pixels (default 1920)
 * @param quality Image quality 0-1 (default 0.8)
 * @returns Compressed image as base64 data URL
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 0.5,
  maxWidthOrHeight: number = 1920,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height * maxWidthOrHeight) / width)
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width * maxWidthOrHeight) / height)
            height = maxWidthOrHeight
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64 with quality compression
        const mimeType = file.type || 'image/jpeg'
        let currentQuality = quality
        let compressedDataUrl = canvas.toDataURL(mimeType, currentQuality)

        // If still too large, reduce quality further
        const maxSizeBytes = maxSizeMB * 1024 * 1024
        let iterations = 0
        while (compressedDataUrl.length > maxSizeBytes && currentQuality > 0.1 && iterations < 10) {
          currentQuality -= 0.1
          compressedDataUrl = canvas.toDataURL(mimeType, currentQuality)
          iterations++
        }

        console.log(`[Image Compression] Original: ${(e.target?.result as string).length / 1024}KB -> Compressed: ${compressedDataUrl.length / 1024}KB (quality: ${currentQuality})`)

        resolve(compressedDataUrl)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Compress a base64 data URL image
 * @param dataUrl Base64 data URL
 * @param maxSizeMB Maximum size in MB
 * @param maxWidthOrHeight Maximum width or height in pixels
 * @param quality Image quality 0-1
 * @returns Compressed image as base64 data URL
 */
export async function compressBase64Image(
  dataUrl: string,
  maxSizeMB: number = 0.5,
  maxWidthOrHeight: number = 1920,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidthOrHeight) {
          height = Math.round((height * maxWidthOrHeight) / width)
          width = maxWidthOrHeight
        }
      } else {
        if (height > maxWidthOrHeight) {
          width = Math.round((width * maxWidthOrHeight) / height)
          height = maxWidthOrHeight
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Detect mime type from data URL
      const mimeMatch = dataUrl.match(/data:(image\/[a-z]+);/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

      // Convert to base64 with quality compression
      let currentQuality = quality
      let compressedDataUrl = canvas.toDataURL(mimeType, currentQuality)

      // If still too large, reduce quality further
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      let iterations = 0
      while (compressedDataUrl.length > maxSizeBytes && currentQuality > 0.1 && iterations < 10) {
        currentQuality -= 0.1
        compressedDataUrl = canvas.toDataURL(mimeType, currentQuality)
        iterations++
      }

      console.log(`[Image Compression] Original: ${dataUrl.length / 1024}KB -> Compressed: ${compressedDataUrl.length / 1024}KB (quality: ${currentQuality})`)

      resolve(compressedDataUrl)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = dataUrl
  })
}
