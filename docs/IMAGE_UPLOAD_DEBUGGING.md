# Image Upload Debugging Guide

## The Problem

When sending large images (1.2MB+) with chat messages, the request hangs and never reaches the backend.

## Root Causes

1. **Request Body Size Limits**
   - Next.js API routes have platform-dependent body size limits
   - Vercel Hobby: 4.5MB limit
   - Vercel Pro: 100MB limit
   - Base64 encoding adds ~33% overhead to file sizes

2. **No Timeout Configuration**
   - Large uploads need adequate timeout settings
   - Default timeouts may be too short for large payloads

## Solutions Implemented

### 1. API Route Configuration
Added timeout and runtime configuration to the proxy route:

```typescript
// app/api/proxy/[...path]/route.ts
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout
```

### 2. Client-Side Image Compression
Implemented automatic image compression before upload to reduce payload size:

**Features:**
- Compresses images to max 0.5MB
- Resizes to max 1920px (width or height)
- Maintains aspect ratio
- Quality adjustment (0.8 default)
- Fallback to original if compression fails
- Loading indicator during compression

**Location:** `lib/utils/image-compression.ts`

**Usage:** Automatically applied in `ChatInputArea` component

## Debugging Tips

### Check Browser Network Tab

1. Open Chrome DevTools (F12) → Network tab
2. Try uploading an image
3. Look for the request to `/api/proxy/agent/query`
4. Check:
   - **Status**: Should be 200, not pending indefinitely
   - **Request payload size**: Should be < 1MB after compression
   - **Response time**: Should complete within 60s

### Check Console Logs

Look for compression logs:
```
[Upload] Processing image.jpg (1.23MB)
[Image Compression] Original: 1230KB -> Compressed: 456KB (quality: 0.8)
```

### Backend Logs

Check if the request reaches your backend:
```
[Proxy] Starting handleProxy for path: agent/query
[Proxy] Auth check: { userId: ..., authError: null }
[API] Sending chat query payload: { query: "hi", images: [...], ... }
```

### Common Issues

**Issue:** Request still hangs even with compression
**Solution:** Check platform limits (Vercel Hobby = 4.5MB max). Multiple images may still exceed limits.

**Issue:** Images not compressing
**Solution:** Check browser console for compression errors. Ensure the image-compression utility is imported correctly.

**Issue:** Backend receives empty images array
**Solution:** Verify the images array is being passed in the chatStream call and through the proxy route.

**Issue:** Model not switching to vision model
**Solution:** Check the proxy route logic that switches from `qwen-max` → `qwen-vl-max` when images are present.

## Testing Recommendations

1. **Test with small images first** (< 100KB)
   - Verify end-to-end flow works

2. **Test with large images** (1-2MB)
   - Verify compression works
   - Check compressed size in network tab

3. **Test with multiple images**
   - Ensure total payload stays under limits

4. **Test on production**
   - Vercel and local dev may have different limits
   - Ensure `maxDuration` is supported in your plan

## Configuration Options

### Adjust Compression Settings

Edit `components/chat/chat-input-area.tsx`:

```typescript
// Current: 0.5MB max, 1920px, 0.8 quality
const compressed = await compressImage(file, 0.5, 1920, 0.8)

// More aggressive compression (smaller files, lower quality):
const compressed = await compressImage(file, 0.3, 1280, 0.7)

// Less compression (larger files, higher quality):
const compressed = await compressImage(file, 1.0, 2560, 0.9)
```

### Adjust Timeout

Edit `app/api/proxy/[...path]/route.ts`:

```typescript
export const maxDuration = 60 // Increase if needed (max depends on Vercel plan)
```

## Alternative Solutions

If compression isn't enough:

1. **Direct Upload to Storage**
   - Upload images to OSS/S3 first
   - Send only image URLs to backend
   - More complex but handles unlimited sizes

2. **Chunk Uploads**
   - Split large files into chunks
   - Upload chunks separately
   - Reassemble on backend

3. **WebSocket Connection**
   - Use WebSocket instead of HTTP
   - Better for large binary data
   - Requires backend WebSocket support
