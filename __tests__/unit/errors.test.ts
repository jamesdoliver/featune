import { getUserFriendlyError } from '@/lib/errors'

describe('getUserFriendlyError', () => {
  describe('file size errors', () => {
    it('maps "too large" to file size message', () => {
      expect(getUserFriendlyError('File is too large')).toBe(
        'File exceeds size limit. Please compress and try again.'
      )
    })

    it('maps "payload" to file size message', () => {
      expect(getUserFriendlyError('Request payload too big')).toBe(
        'File exceeds size limit. Please compress and try again.'
      )
    })

    it('maps "exceeded" to file size message', () => {
      expect(getUserFriendlyError('Upload limit exceeded')).toBe(
        'File exceeds size limit. Please compress and try again.'
      )
    })

    it('maps "size limit" to file size message', () => {
      expect(getUserFriendlyError('File size limit reached')).toBe(
        'File exceeds size limit. Please compress and try again.'
      )
    })
  })

  describe('network errors', () => {
    it('maps "network" to network message', () => {
      expect(getUserFriendlyError('Network error occurred')).toBe(
        'Upload failed due to network issue. Check your connection and try again.'
      )
    })

    it('maps "failed to fetch" to network message', () => {
      expect(getUserFriendlyError('Failed to fetch resource')).toBe(
        'Upload failed due to network issue. Check your connection and try again.'
      )
    })

    it('maps "connection" to network message', () => {
      expect(getUserFriendlyError('Connection refused')).toBe(
        'Upload failed due to network issue. Check your connection and try again.'
      )
    })
  })

  describe('storage errors', () => {
    it('maps "storage" to storage message', () => {
      expect(getUserFriendlyError('Storage quota full')).toBe(
        'Storage temporarily unavailable. Please try again in a moment.'
      )
    })

    it('maps "bucket" to storage message', () => {
      expect(getUserFriendlyError('Bucket not found')).toBe(
        'Storage temporarily unavailable. Please try again in a moment.'
      )
    })

    it('maps "object not found" to storage message', () => {
      expect(getUserFriendlyError('Object not found in storage')).toBe(
        'Storage temporarily unavailable. Please try again in a moment.'
      )
    })
  })

  describe('auth errors', () => {
    it('maps "auth" to session message', () => {
      expect(getUserFriendlyError('Auth token invalid')).toBe(
        'Session expired. Please log in again.'
      )
    })

    it('maps "401" to session message', () => {
      expect(getUserFriendlyError('HTTP 401 Unauthorized')).toBe(
        'Session expired. Please log in again.'
      )
    })

    it('maps "not authenticated" to session message', () => {
      expect(getUserFriendlyError('User is not authenticated')).toBe(
        'Session expired. Please log in again.'
      )
    })

    it('maps "session" to session message', () => {
      expect(getUserFriendlyError('Session has expired')).toBe(
        'Session expired. Please log in again.'
      )
    })
  })

  describe('processing errors', () => {
    it('maps "processing" to processing message', () => {
      expect(getUserFriendlyError('Audio processing failed')).toBe(
        'Audio processing failed. Your track was saved but previews may be missing.'
      )
    })

    it('maps "waveform" to processing message', () => {
      expect(getUserFriendlyError('Waveform generation error')).toBe(
        'Audio processing failed. Your track was saved but previews may be missing.'
      )
    })

    it('maps "watermark" to processing message', () => {
      expect(getUserFriendlyError('Watermark overlay failed')).toBe(
        'Audio processing failed. Your track was saved but previews may be missing.'
      )
    })
  })

  describe('database duplicate errors', () => {
    it('maps "duplicate" to duplicate message', () => {
      expect(getUserFriendlyError('Duplicate key value')).toBe(
        'A track with this information already exists.'
      )
    })

    it('maps "unique constraint" to duplicate message', () => {
      expect(getUserFriendlyError('Unique constraint violation on tracks')).toBe(
        'A track with this information already exists.'
      )
    })
  })

  describe('database foreign key errors', () => {
    it('maps "foreign key" to account status message', () => {
      expect(getUserFriendlyError('Foreign key constraint failed')).toBe(
        'Unable to save track. Please check your account status.'
      )
    })

    it('maps "violates" to account status message', () => {
      expect(getUserFriendlyError('Violates check constraint')).toBe(
        'Unable to save track. Please check your account status.'
      )
    })
  })

  describe('timeout errors', () => {
    it('maps "timeout" to timeout message', () => {
      expect(getUserFriendlyError('Request timeout')).toBe(
        'Upload timed out. Please try again with a smaller file or better connection.'
      )
    })

    it('maps "timed out" to timeout message', () => {
      expect(getUserFriendlyError('Request timed out waiting for response')).toBe(
        'Upload timed out. Please try again with a smaller file or better connection.'
      )
    })
  })

  describe('permission errors', () => {
    it('maps "permission" to permission message', () => {
      expect(getUserFriendlyError('Permission denied on resource')).toBe(
        'You do not have permission to perform this action.'
      )
    })

    it('maps "403" to permission message', () => {
      expect(getUserFriendlyError('HTTP 403 Forbidden')).toBe(
        'You do not have permission to perform this action.'
      )
    })

    it('maps "denied" to permission message', () => {
      expect(getUserFriendlyError('Access denied')).toBe(
        'You do not have permission to perform this action.'
      )
    })
  })

  describe('server errors', () => {
    it('maps "500" to server error message', () => {
      expect(getUserFriendlyError('HTTP 500')).toBe(
        'Server error. Please try again later.'
      )
    })

    it('maps "internal server" to server error message', () => {
      expect(getUserFriendlyError('Internal server error')).toBe(
        'Server error. Please try again later.'
      )
    })
  })

  describe('technical fallback messages', () => {
    it('returns generic message for strings containing underscores', () => {
      expect(getUserFriendlyError('some_technical_error')).toBe(
        'Upload failed. Please try again or contact support if the issue persists.'
      )
    })

    it('returns generic message for strings containing "::"', () => {
      expect(getUserFriendlyError('module::submodule error')).toBe(
        'Upload failed. Please try again or contact support if the issue persists.'
      )
    })

    it('returns generic message for strings longer than 100 characters', () => {
      const longMessage = 'a'.repeat(101)
      expect(getUserFriendlyError(longMessage)).toBe(
        'Upload failed. Please try again or contact support if the issue persists.'
      )
    })
  })

  describe('clean passthrough messages', () => {
    it('returns the original message for short, clean strings', () => {
      expect(getUserFriendlyError('Something went wrong')).toBe(
        'Something went wrong'
      )
    })

    it('returns the original message when no pattern matches', () => {
      expect(getUserFriendlyError('Invalid file format')).toBe(
        'Invalid file format'
      )
    })
  })

  describe('Error object handling', () => {
    it('accepts an Error object and maps its message', () => {
      const error = new Error('File is too large')
      expect(getUserFriendlyError(error)).toBe(
        'File exceeds size limit. Please compress and try again.'
      )
    })

    it('accepts an Error object with a clean message and passes it through', () => {
      const error = new Error('Unknown error')
      expect(getUserFriendlyError(error)).toBe('Unknown error')
    })
  })

  describe('case insensitivity', () => {
    it('matches "TOO LARGE" in uppercase', () => {
      expect(getUserFriendlyError('FILE IS TOO LARGE')).toBe(
        'File exceeds size limit. Please compress and try again.'
      )
    })

    it('matches "Network" in mixed case', () => {
      expect(getUserFriendlyError('NETWORK Error')).toBe(
        'Upload failed due to network issue. Check your connection and try again.'
      )
    })

    it('matches "Timed Out" in title case', () => {
      expect(getUserFriendlyError('Request Timed Out')).toBe(
        'Upload timed out. Please try again with a smaller file or better connection.'
      )
    })
  })
})
