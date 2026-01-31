import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderLicenseType } from '@/lib/types/database'

export interface LicensePDFParams {
  licenseId: string
  licenseType: OrderLicenseType
  buyerName: string
  buyerEmail: string
  purchaseDate: Date
  trackTitle: string
  creatorName: string
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

// Comprehensive license terms for each license type
const LICENSE_RIGHTS: Record<OrderLicenseType, string[]> = {
  non_exclusive: [
    'Use in unlimited commercial projects (music, video, games, ads, podcasts, films)',
    'Monetization on all streaming platforms with no revenue caps',
    'Full modification rights (pitch, chop, effects, remix)',
    'Worldwide, perpetual usage - license never expires',
    'No royalties owed after purchase',
  ],
  exclusive: [
    'All non-exclusive rights, plus:',
    'Sole commercial usage rights - no new licenses will be issued',
    'Track removed from FEATUNE marketplace',
    'Prior non-exclusive licenses remain valid for existing buyers',
  ],
}

const LICENSE_RESTRICTIONS: string[] = [
  'No redistribution of raw audio files',
  'No sublicensing or transfer of license to third parties',
  'No use for AI/ML training or voice synthesis',
  'No use in hate speech, illegal, or defamatory content',
  'Creator retains copyright; you receive usage rights',
]

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatLicenseType(type: OrderLicenseType): string {
  return type === 'exclusive' ? 'Exclusive License' : 'Non-Exclusive License'
}

/**
 * Draws a filled rectangle on the page. Utility to reduce repetition.
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

export async function generateLicensePDF(
  params: LicensePDFParams
): Promise<Uint8Array> {
  const {
    licenseId,
    licenseType,
    buyerName,
    buyerEmail,
    purchaseDate,
    trackTitle,
    creatorName,
  } = params

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter
  const { width, height } = page.getSize()

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // -- Background --
  drawRect(page, 0, 0, width, height, COLORS.background)

  const margin = 50
  const contentWidth = width - margin * 2
  let y = height - margin

  // -- Header: FEATUNE branding --
  const brandFontSize = 32
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

  // -- Prominent buyer name --
  const buyerNameFontSize = 20
  page.drawText(buyerName, {
    x: margin,
    y,
    size: buyerNameFontSize,
    font: helveticaBold,
    color: COLORS.white,
  })
  y -= 18

  // Buyer email below name
  page.drawText(buyerEmail, {
    x: margin,
    y,
    size: 11,
    font: helvetica,
    color: COLORS.muted,
  })
  y -= 28

  // -- Track identification card --
  const trackCardPadding = 16
  const trackCardHeight = 70
  const trackCardY = y - trackCardHeight

  drawRect(page, margin, trackCardY, contentWidth, trackCardHeight, COLORS.cardBg)
  drawRect(page, margin, y, contentWidth, 2, COLORS.orange)

  // Track title
  page.drawText('LICENSED TRACK', {
    x: margin + trackCardPadding,
    y: y - 20,
    size: 9,
    font: helveticaBold,
    color: COLORS.muted,
  })

  page.drawText(trackTitle, {
    x: margin + trackCardPadding,
    y: y - 38,
    size: 14,
    font: helveticaBold,
    color: COLORS.white,
  })

  page.drawText(`by ${creatorName}`, {
    x: margin + trackCardPadding,
    y: y - 55,
    size: 11,
    font: helvetica,
    color: COLORS.muted,
  })

  y = trackCardY - 20

  // -- License details row --
  const detailsValueFontSize = 11

  // License Type
  page.drawText('LICENSE TYPE', {
    x: margin,
    y,
    size: 9,
    font: helveticaBold,
    color: COLORS.muted,
  })
  page.drawText(formatLicenseType(licenseType), {
    x: margin,
    y: y - 14,
    size: detailsValueFontSize,
    font: helveticaBold,
    color: COLORS.orange,
  })

  // Purchase Date
  const dateX = margin + 160
  page.drawText('PURCHASE DATE', {
    x: dateX,
    y,
    size: 9,
    font: helveticaBold,
    color: COLORS.muted,
  })
  page.drawText(formatDate(purchaseDate), {
    x: dateX,
    y: y - 14,
    size: detailsValueFontSize,
    font: helvetica,
    color: COLORS.white,
  })

  // License ID
  const idX = margin + 340
  page.drawText('LICENSE ID', {
    x: idX,
    y,
    size: 9,
    font: helveticaBold,
    color: COLORS.muted,
  })
  // Truncate license ID if too long
  const displayLicenseId = licenseId.length > 20 ? licenseId.slice(0, 20) + '...' : licenseId
  page.drawText(displayLicenseId, {
    x: idX,
    y: y - 14,
    size: detailsValueFontSize,
    font: helvetica,
    color: COLORS.white,
  })

  y -= 45

  // -- Rights section --
  const sectionTitleFontSize = 12
  const bulletFontSize = 10
  const lineHeight = 15

  page.drawText('YOUR RIGHTS', {
    x: margin,
    y,
    size: sectionTitleFontSize,
    font: helveticaBold,
    color: COLORS.white,
  })
  y -= 18

  const rights = LICENSE_RIGHTS[licenseType]
  for (const right of rights) {
    const bullet = right.startsWith('All ') ? '   ' : '•  '
    const wrappedLines = wrapText(bullet + right, helvetica, bulletFontSize, contentWidth - 10)
    for (const line of wrappedLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: bulletFontSize,
        font: helvetica,
        color: COLORS.muted,
      })
      y -= lineHeight
    }
  }

  y -= 12

  // -- Restrictions section --
  page.drawText('RESTRICTIONS', {
    x: margin,
    y,
    size: sectionTitleFontSize,
    font: helveticaBold,
    color: COLORS.white,
  })
  y -= 18

  for (const restriction of LICENSE_RESTRICTIONS) {
    const wrappedLines = wrapText('•  ' + restriction, helvetica, bulletFontSize, contentWidth - 10)
    for (const line of wrappedLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: bulletFontSize,
        font: helvetica,
        color: COLORS.muted,
      })
      y -= lineHeight
    }
  }

  y -= 15

  // Full terms reference with box
  const refBoxHeight = 40
  const refBoxY = y - refBoxHeight
  drawRect(page, margin, refBoxY, contentWidth, refBoxHeight, COLORS.cardBg)

  page.drawText('Full license terms:', {
    x: margin + 12,
    y: refBoxY + 24,
    size: 10,
    font: helveticaBold,
    color: COLORS.muted,
  })

  page.drawText('featune.com/terms', {
    x: margin + 12,
    y: refBoxY + 10,
    size: 11,
    font: helveticaBold,
    color: COLORS.orange,
  })

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

  // License ID in the footer, right-aligned
  const footerIdText = `License ID: ${licenseId}`
  const footerIdWidth = helvetica.widthOfTextAtSize(footerIdText, 9)
  page.drawText(footerIdText, {
    x: width - margin - footerIdWidth,
    y: footerY,
    size: 9,
    font: helvetica,
    color: COLORS.muted,
  })

  return pdfDoc.save()
}

export async function uploadLicensePDF(
  pdfBytes: Uint8Array,
  licenseId: string
): Promise<string> {
  const supabase = createAdminClient()
  const filePath = `licenses/${licenseId}.pdf`

  const { error } = await supabase.storage
    .from('licenses')
    .upload(filePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload license PDF: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('licenses')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
