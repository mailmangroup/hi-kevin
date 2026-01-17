/**
 * File utility functions for document handling
 */

// Supported document types (aligned with backend)
export const SUPPORTED_DOCUMENT_TYPES = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  doc: ['application/msword'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  xls: ['application/vnd.ms-excel'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/x-markdown'],
  markdown: ['text/markdown', 'text/x-markdown'],
  html: ['text/html'],
  htm: ['text/html'],
  csv: ['text/csv'],
  json: ['application/json'],
  xml: ['application/xml', 'text/xml'],
}

// All supported extensions
export const SUPPORTED_EXTENSIONS = Object.keys(SUPPORTED_DOCUMENT_TYPES)

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase()
  }
  return ''
}

/**
 * Check if file type is supported
 */
export function isSupportedFileType(filename: string): boolean {
  const ext = getFileExtension(filename)
  return SUPPORTED_EXTENSIONS.includes(ext)
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename)
  const mimeTypes = SUPPORTED_DOCUMENT_TYPES[ext as keyof typeof SUPPORTED_DOCUMENT_TYPES]
  return mimeTypes ? mimeTypes[0] : 'application/octet-stream'
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Get file type display name
 */
export function getFileTypeDisplay(filename: string): string {
  const ext = getFileExtension(filename)

  const displayNames: Record<string, string> = {
    pdf: 'PDF',
    docx: 'Word',
    doc: 'Word',
    pptx: 'PowerPoint',
    xlsx: 'Excel',
    xls: 'Excel',
    txt: 'Text',
    md: 'Markdown',
    markdown: 'Markdown',
    html: 'HTML',
    htm: 'HTML',
    csv: 'CSV',
    json: 'JSON',
    xml: 'XML',
  }

  return displayNames[ext] || ext.toUpperCase()
}

/**
 * Get file icon name/class based on file type
 * Returns a generic icon identifier that can be used with icon libraries
 */
export function getFileIconType(filename: string): string {
  const ext = getFileExtension(filename)

  // Map extensions to icon types
  const iconMap: Record<string, string> = {
    pdf: 'file-pdf',
    docx: 'file-word',
    doc: 'file-word',
    pptx: 'file-powerpoint',
    xlsx: 'file-excel',
    xls: 'file-excel',
    txt: 'file-text',
    md: 'file-text',
    markdown: 'file-text',
    html: 'file-code',
    htm: 'file-code',
    csv: 'file-spreadsheet',
    json: 'file-code',
    xml: 'file-code',
  }

  return iconMap[ext] || 'file'
}

/**
 * Get file color based on file type (for UI styling)
 */
export function getFileColor(filename: string): string {
  const ext = getFileExtension(filename)

  const colorMap: Record<string, string> = {
    pdf: 'red',
    docx: 'blue',
    doc: 'blue',
    pptx: 'orange',
    xlsx: 'green',
    xls: 'green',
    txt: 'gray',
    md: 'purple',
    markdown: 'purple',
    html: 'yellow',
    htm: 'yellow',
    csv: 'green',
    json: 'yellow',
    xml: 'yellow',
  }

  return colorMap[ext] || 'gray'
}

/**
 * Validate file before upload
 * Returns error message if invalid, null if valid
 */
export function validateFile(
  file: File,
  maxSizeBytes: number = 10 * 1024 * 1024  // 10MB default
): string | null {
  // Check if file type is supported
  if (!isSupportedFileType(file.name)) {
    const ext = getFileExtension(file.name)
    return `Unsupported file type: .${ext}. Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024)
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
  }

  // Check for empty file
  if (file.size === 0) {
    return 'File is empty'
  }

  return null
}

/**
 * Truncate filename if too long
 */
export function truncateFilename(filename: string, maxLength: number = 30): string {
  if (filename.length <= maxLength) {
    return filename
  }

  const ext = getFileExtension(filename)
  const nameWithoutExt = filename.substring(0, filename.length - ext.length - 1)
  const truncatedName = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...'

  return ext ? `${truncatedName}.${ext}` : truncatedName
}
