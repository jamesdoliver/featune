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

const LICENSE_TERMS: Record<OrderLicenseType, string> = {
  non_exclusive:
    'This non-exclusive license grants you the right to use this vocal topline in one ' +
    'commercial release. The creator retains ownership and may license this track to others.',
  exclusive:
    'This exclusive license grants you full exclusive rights to this vocal topline. ' +
    'The creator will not license this track to anyone else. All rights are transferred to you.',
}

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

  const margin = 60
  const contentWidth = width - margin * 2
  let y = height - margin

  // -- Header: FEATUNE branding --
  const brandFontSize = 36
  page.drawText('FEATUNE', {
    x: margin,
    y,
    size: brandFontSize,
    font: helveticaBold,
    color: COLORS.orange,
  })
  y -= 8

  // Orange accent line under branding
  drawRect(page, margin, y, contentWidth, 3, COLORS.orange)
  y -= 30

  // -- Title: License Certificate --
  const titleFontSize = 22
  page.drawText('License Certificate', {
    x: margin,
    y,
    size: titleFontSize,
    font: helveticaBold,
    color: COLORS.white,
  })
  y -= 12

  // Subtitle with license type
  const subtitleFontSize = 13
  page.drawText(formatLicenseType(licenseType), {
    x: margin,
    y,
    size: subtitleFontSize,
    font: helvetica,
    color: COLORS.orange,
  })
  y -= 40

  // -- License details card --
  const cardPadding = 20
  const labelFontSize = 10
  const valueFontSize = 12
  const rowHeight = 38

  const fields: { label: string; value: string }[] = [
    { label: 'LICENSE ID', value: licenseId },
    { label: 'LICENSE TYPE', value: formatLicenseType(licenseType) },
    { label: 'TRACK', value: trackTitle },
    { label: 'CREATOR', value: creatorName },
    { label: 'LICENSED TO', value: `${buyerName} (${buyerEmail})` },
    { label: 'PURCHASE DATE', value: formatDate(purchaseDate) },
  ]

  const cardHeight = fields.length * rowHeight + cardPadding * 2
  const cardY = y - cardHeight

  // Card background
  drawRect(page, margin, cardY, contentWidth, cardHeight, COLORS.cardBg)

  // Card top accent border
  drawRect(page, margin, y, contentWidth, 2, COLORS.orange)

  // Draw each field row
  let fieldY = y - cardPadding - labelFontSize
  for (let i = 0; i < fields.length; i++) {
    const { label, value } = fields[i]

    // Label
    page.drawText(label, {
      x: margin + cardPadding,
      y: fieldY,
      size: labelFontSize,
      font: helveticaBold,
      color: COLORS.muted,
    })

    // Value
    page.drawText(value, {
      x: margin + cardPadding,
      y: fieldY - 16,
      size: valueFontSize,
      font: helvetica,
      color: COLORS.white,
    })

    // Separator line (not after the last field)
    if (i < fields.length - 1) {
      drawRect(
        page,
        margin + cardPadding,
        fieldY - 24,
        contentWidth - cardPadding * 2,
        1,
        COLORS.border
      )
    }

    fieldY -= rowHeight
  }

  y = cardY - 35

  // -- Terms section --
  const termsTitleFontSize = 14
  page.drawText('Terms & Conditions', {
    x: margin,
    y,
    size: termsTitleFontSize,
    font: helveticaBold,
    color: COLORS.white,
  })
  y -= 20

  // Terms body text with word wrapping
  const termsBodyFontSize = 11
  const termsText = LICENSE_TERMS[licenseType]
  const wrappedTerms = wrapText(
    termsText,
    helvetica,
    termsBodyFontSize,
    contentWidth
  )

  for (const line of wrappedTerms) {
    page.drawText(line, {
      x: margin,
      y,
      size: termsBodyFontSize,
      font: helvetica,
      color: COLORS.muted,
    })
    y -= 17
  }

  y -= 10

  // Full terms reference
  const referenceText =
    'For the complete license agreement, please visit featune.com/terms'
  page.drawText(referenceText, {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: COLORS.muted,
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
