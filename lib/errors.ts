/**
 * Converts technical error messages into user-friendly messages
 */
export function getUserFriendlyError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message
  const lowerMessage = message.toLowerCase()

  // File size errors
  if (
    lowerMessage.includes('too large') ||
    lowerMessage.includes('payload') ||
    lowerMessage.includes('exceeded') ||
    lowerMessage.includes('size limit')
  ) {
    return 'File exceeds size limit. Please compress and try again.'
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('connection')
  ) {
    return 'Upload failed due to network issue. Check your connection and try again.'
  }

  // Storage errors
  if (
    lowerMessage.includes('storage') ||
    lowerMessage.includes('bucket') ||
    lowerMessage.includes('object not found')
  ) {
    return 'Storage temporarily unavailable. Please try again in a moment.'
  }

  // Auth errors
  if (
    lowerMessage.includes('auth') ||
    lowerMessage.includes('401') ||
    lowerMessage.includes('not authenticated') ||
    lowerMessage.includes('session')
  ) {
    return 'Session expired. Please log in again.'
  }

  // Processing errors
  if (
    lowerMessage.includes('processing') ||
    lowerMessage.includes('waveform') ||
    lowerMessage.includes('watermark')
  ) {
    return 'Audio processing failed. Your track was saved but previews may be missing.'
  }

  // Database errors
  if (
    lowerMessage.includes('duplicate') ||
    lowerMessage.includes('unique constraint')
  ) {
    return 'A track with this information already exists.'
  }

  if (
    lowerMessage.includes('foreign key') ||
    lowerMessage.includes('violates')
  ) {
    return 'Unable to save track. Please check your account status.'
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'Upload timed out. Please try again with a smaller file or better connection.'
  }

  // Permission errors
  if (
    lowerMessage.includes('permission') ||
    lowerMessage.includes('403') ||
    lowerMessage.includes('denied')
  ) {
    return 'You do not have permission to perform this action.'
  }

  // Server errors
  if (lowerMessage.includes('500') || lowerMessage.includes('internal server')) {
    return 'Server error. Please try again later.'
  }

  // Default: return original message with prefix if technical
  if (message.includes('_') || message.includes('::') || message.length > 100) {
    return 'Upload failed. Please try again or contact support if the issue persists.'
  }

  return message
}
