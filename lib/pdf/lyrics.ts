import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createAdminClient } from '@/lib/supabase/admin'

export interface LyricsPDFParams {
  trackId: string
  trackTitle: string
  creatorName: string
  lyrics: string
}

// Brand colors converted to 0-1 RGB range
const COLORS = {
  background: rgb(0x1a / 255, 0x1a / 255, 0x1a / 255), // #1A1A1A
  white: rgb(1, 1, 1),                                    // #FFFFFF
  orange: rgb(0xff / 255, 0x6b / 255, 0x00 / 255),       // #FF6B00
  muted: rgb(0xa0 / 255, 0xa0 / 255, 0xa0 / 255),        // #A0A0A0
  border: rgb(0x2a / 255, 0x2a / 255, 0x2a / 255),       // #2A2A2A
  cardBg: rgb(0x22 / 255, 0x22 / 255, 0x22 / 255),       // #222222
} as const

/**
 * Draws a filled rectangle on the page.
 */
function drawRect(
  page: ReturnType<PDFDocument['addPage']>,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ReturnType<typeof rgb>
) {
  page.drawRectangle({ x, y, width, height, color })
}

/**
 * Wraps text to fit within a given maximum width. Returns an array of lines.
 */
function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

export async function generateLyricsPDF(
  params: LyricsPDFParams
): Promise<Uint8Array> {
  const { trackTitle, creatorName, lyrics } = params

  const pdfDoc = await PDFDocument.create()

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const margin = 50
  const pageWidth = 612 // US Letter width
  const pageHeight = 792 // US Letter height
  const contentWidth = pageWidth - margin * 2
  const lyricsFontSize = 11
  const lineHeight = 16
  const headerHeight = 120 // Space for branding, title, creator
  const footerHeight = 40 // Space for footer

  // Pre-process lyrics into lines (respecting original line breaks)
  const lyricsLines: string[] = []
  const rawLines = lyrics.split(/\r?\n/)

  for (const rawLine of rawLines) {
    if (rawLine.trim() === '') {
      // Preserve empty lines for verse separation
      lyricsLines.push('')
    } else {
      // Wrap long lines to fit within content width
      const wrapped = wrapText(rawLine, helvetica, lyricsFontSize, contentWidth)
      lyricsLines.push(...wrapped)
    }
  }

  // Calculate how many lines fit per page (excluding header on first page)
  const availableHeight = pageHeight - margin * 2 - footerHeight
  const firstPageAvailable = availableHeight - headerHeight
  const linesPerFirstPage = Math.floor(firstPageAvailable / lineHeight)
  const linesPerSubsequentPage = Math.floor(availableHeight / lineHeight)

  // Split lyrics across pages
  let remainingLines = [...lyricsLines]
  let pageIndex = 0

  while (remainingLines.length > 0 || pageIndex === 0) {
    const page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin

    // -- Background --
    drawRect(page, 0, 0, pageWidth, pageHeight, COLORS.background)

    // -- Header (first page only) --
    if (pageIndex === 0) {
      // FEATUNE branding
      const brandFontSize = 28
      page.drawText('FEATUNE', {
        x: margin,
        y,
        size: brandFontSize,
        font: helveticaBold,
        color: COLORS.orange,
      })
      y -= 6

      // Orange accent line under branding
      drawRect(page, margin, y, contentWidth, 3, COLORS.orange)
      y -= 28

      // Track title
      page.drawText(trackTitle, {
        x: margin,
        y,
        size: 18,
        font: helveticaBold,
        color: COLORS.white,
      })
      y -= 22

      // Creator name
      page.drawText(`by ${creatorName}`, {
        x: margin,
        y,
        size: 12,
        font: helvetica,
        color: COLORS.muted,
      })
      y -= 30

      // Section divider
      drawRect(page, margin, y, contentWidth, 1, COLORS.border)
      y -= 20
    }

    // Determine how many lines fit on this page
    const maxLines = pageIndex === 0 ? linesPerFirstPage : linesPerSubsequentPage
    const pageLyricsLines = remainingLines.slice(0, maxLines)
    remainingLines = remainingLines.slice(maxLines)

    // -- Lyrics content --
    for (const line of pageLyricsLines) {
      if (line === '') {
        y -= lineHeight // Empty line for verse spacing
      } else {
        page.drawText(line, {
          x: margin,
          y,
          size: lyricsFontSize,
          font: helvetica,
          color: COLORS.white,
        })
        y -= lineHeight
      }
    }

    // -- Footer --
    const footerY = margin
    drawRect(page, margin, footerY + 18, contentWidth, 1, COLORS.border)

    page.drawText('Generated by FEATUNE - featune.com', {
      x: margin,
      y: footerY,
      size: 9,
      font: helvetica,
      color: COLORS.muted,
    })

    // Page number (right-aligned)
    const pageNumText = `Page ${pageIndex + 1}`
    const pageNumWidth = helvetica.widthOfTextAtSize(pageNumText, 9)
    page.drawText(pageNumText, {
      x: pageWidth - margin - pageNumWidth,
      y: footerY,
      size: 9,
      font: helvetica,
      color: COLORS.muted,
    })

    pageIndex++

    // Break if no more lines
    if (remainingLines.length === 0) break
  }

  return pdfDoc.save()
}

export async function uploadLyricsPDF(
  pdfBytes: Uint8Array,
  trackId: string
): Promise<string> {
  const supabase = createAdminClient()
  const filePath = `tracks/${trackId}/lyrics.pdf`

  const { error } = await supabase.storage
    .from('tracks-private')
    .upload(filePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload lyrics PDF: ${error.message}`)
  }

  // Return the storage path (not public URL since it's in private bucket)
  return filePath
}
