import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = 'FEATUNE <noreply@featune.com>'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://featune.com'

// ---------------------------------------------------------------------------
// Shared email layout helpers
// ---------------------------------------------------------------------------

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FEATUNE</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1A1A1A;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #2A2A2A;">
              <span style="font-size:28px;font-weight:800;letter-spacing:2px;color:#FF6B00;">FEATUNE</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #2A2A2A;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#666666;">Thank you for choosing FEATUNE</p>
              <p style="margin:0;font-size:12px;color:#666666;">
                <a href="${SITE_URL}" style="color:#FF6B00;text-decoration:none;">featune.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

// ---------------------------------------------------------------------------
// 1. Purchase Confirmation
// ---------------------------------------------------------------------------

export interface PurchaseConfirmationParams {
  to: string
  buyerName: string
  orderId: string
  items: Array<{
    trackTitle: string
    creatorName: string
    licenseType: string
    price: number
    licensePdfUrl?: string
  }>
  subtotal: number
  discountPercent: number
  discountAmount: number
  total: number
}

export async function sendPurchaseConfirmation(params: PurchaseConfirmationParams): Promise<void> {
  const { to, buyerName, orderId, items, subtotal, discountPercent, discountAmount, total } = params

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #2A2A2A;color:#FFFFFF;font-size:14px;">
          ${item.trackTitle}
          <br/>
          <span style="color:#A0A0A0;font-size:12px;">by ${item.creatorName}</span>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #2A2A2A;color:#A0A0A0;font-size:13px;text-align:center;">
          ${item.licenseType}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #2A2A2A;color:#FFFFFF;font-size:14px;text-align:right;">
          ${formatCurrency(item.price)}
        </td>
      </tr>`
    )
    .join('')

  const licensePdfLinks = items
    .filter((item) => item.licensePdfUrl)
    .map(
      (item) =>
        `<li style="margin-bottom:6px;">
          <a href="${item.licensePdfUrl}" style="color:#FF6B00;text-decoration:none;font-size:14px;">
            ${item.trackTitle} &mdash; License PDF
          </a>
        </li>`
    )
    .join('')

  const discountSection =
    discountPercent > 0
      ? `
      <tr>
        <td colspan="2" style="padding:8px;color:#A0A0A0;font-size:14px;text-align:right;">
          Discount (${discountPercent}%)
        </td>
        <td style="padding:8px;color:#22C55E;font-size:14px;text-align:right;">
          -${formatCurrency(discountAmount)}
        </td>
      </tr>`
      : ''

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">Your Purchase Confirmation</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;">
      Hi ${buyerName}, thanks for your purchase!
    </p>
    <p style="margin:0 0 24px;font-size:13px;color:#666666;">
      Order ID: <span style="color:#A0A0A0;">${orderId}</span>
    </p>

    <!-- Items Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <th style="padding:8px;text-align:left;font-size:12px;color:#666666;border-bottom:1px solid #2A2A2A;text-transform:uppercase;letter-spacing:0.5px;">Track</th>
        <th style="padding:8px;text-align:center;font-size:12px;color:#666666;border-bottom:1px solid #2A2A2A;text-transform:uppercase;letter-spacing:0.5px;">License</th>
        <th style="padding:8px;text-align:right;font-size:12px;color:#666666;border-bottom:1px solid #2A2A2A;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
      </tr>
      ${itemRows}
      <!-- Subtotal -->
      <tr>
        <td colspan="2" style="padding:8px;color:#A0A0A0;font-size:14px;text-align:right;">Subtotal</td>
        <td style="padding:8px;color:#FFFFFF;font-size:14px;text-align:right;">${formatCurrency(subtotal)}</td>
      </tr>
      ${discountSection}
      <!-- Total -->
      <tr>
        <td colspan="2" style="padding:12px 8px 8px;color:#FFFFFF;font-size:16px;font-weight:700;text-align:right;border-top:1px solid #2A2A2A;">Total</td>
        <td style="padding:12px 8px 8px;color:#FF6B00;font-size:16px;font-weight:700;text-align:right;border-top:1px solid #2A2A2A;">${formatCurrency(total)}</td>
      </tr>
    </table>

    ${
      licensePdfLinks
        ? `
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#FFFFFF;">License Documents</h2>
    <ul style="margin:0 0 24px;padding-left:20px;list-style:none;">
      ${licensePdfLinks}
    </ul>`
        : ''
    }

    <p style="margin:0;font-size:14px;color:#A0A0A0;">
      You can access your purchases anytime from your
      <a href="${SITE_URL}/account/purchases" style="color:#FF6B00;text-decoration:none;">account</a>.
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `FEATUNE - Order Confirmation #${orderId}`,
      html: emailWrapper(content),
    })
  } catch (error) {
    console.error('Failed to send purchase confirmation email:', error)
  }
}

// ---------------------------------------------------------------------------
// 2. Creator Sale Notification
// ---------------------------------------------------------------------------

export interface CreatorSaleNotificationParams {
  to: string
  creatorName: string
  trackTitle: string
  licenseType: string
  earnings: number
}

export async function sendCreatorSaleNotification(params: CreatorSaleNotificationParams): Promise<void> {
  const { to, creatorName, trackTitle, licenseType, earnings } = params

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">You made a sale!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;">
      Great news, ${creatorName}! Someone just purchased your track.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#222222;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 12px;">
                <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Track</span>
                <br/>
                <span style="font-size:16px;font-weight:600;color:#FFFFFF;">${trackTitle}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 12px;">
                <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">License Type</span>
                <br/>
                <span style="font-size:14px;color:#A0A0A0;">${licenseType}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0;">
                <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Your Earnings</span>
                <br/>
                <span style="font-size:20px;font-weight:700;color:#22C55E;">${formatCurrency(earnings)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:#FF6B00;border-radius:6px;">
          <a href="${SITE_URL}/dashboard/earnings" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
            View Dashboard
          </a>
        </td>
      </tr>
    </table>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `FEATUNE - You sold "${trackTitle}"!`,
      html: emailWrapper(content),
    })
  } catch (error) {
    console.error('Failed to send creator sale notification email:', error)
  }
}

// ---------------------------------------------------------------------------
// 3. Welcome Email
// ---------------------------------------------------------------------------

export interface WelcomeEmailParams {
  to: string
  name: string
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const { to, name } = params

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">Welcome to FEATUNE</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#A0A0A0;">
      Hi ${name}, we're glad you're here.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;line-height:1.6;">
      FEATUNE is the marketplace for premium vocal toplines. Browse AI and human vocals across genres,
      find the perfect track for your next project, and get instant access to stems and licenses.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:#FF6B00;border-radius:6px;">
          <a href="${SITE_URL}/search" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
            Browse Tracks
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#666666;text-align:center;">
      Questions? Just reply to this email &mdash; we'd love to hear from you.
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to FEATUNE',
      html: emailWrapper(content),
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

// ---------------------------------------------------------------------------
// 4. Track Approved Email
// ---------------------------------------------------------------------------

export interface TrackApprovedEmailParams {
  creatorEmail: string
  creatorName: string
  trackTitle: string
  trackId: string
}

export async function sendTrackApprovedEmail(params: TrackApprovedEmailParams): Promise<void> {
  const { creatorEmail, creatorName, trackTitle, trackId } = params

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">Your track has been approved!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;">
      Hi ${creatorName}, great news &mdash; your track is now live on FEATUNE.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#222222;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Track</span>
          <br/>
          <span style="font-size:16px;font-weight:600;color:#FFFFFF;">${trackTitle}</span>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:#FF6B00;border-radius:6px;">
          <a href="${SITE_URL}/track/${trackId}" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
            View Your Track
          </a>
        </td>
      </tr>
    </table>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: 'FEATUNE - Your track has been approved!',
      html: emailWrapper(content),
    })
  } catch (error) {
    console.error('Failed to send track approved email:', error)
  }
}

// ---------------------------------------------------------------------------
// 5. Track Rejected Email
// ---------------------------------------------------------------------------

export interface TrackRejectedEmailParams {
  creatorEmail: string
  creatorName: string
  trackTitle: string
  reason?: string
}

export async function sendTrackRejectedEmail(params: TrackRejectedEmailParams): Promise<void> {
  const { creatorEmail, creatorName, trackTitle, reason } = params

  const reasonSection = reason
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#222222;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Reason</span>
          <br/>
          <span style="font-size:14px;color:#A0A0A0;line-height:1.5;">${reason}</span>
        </td>
      </tr>
    </table>`
    : ''

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">Track review update</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;">
      Hi ${creatorName}, unfortunately your track <strong style="color:#FFFFFF;">${trackTitle}</strong> was not approved at this time.
    </p>

    ${reasonSection}

    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;line-height:1.6;">
      Don't be discouraged! Please review the feedback, make any necessary adjustments, and feel free to resubmit.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:#FF6B00;border-radius:6px;">
          <a href="${SITE_URL}/dashboard/upload" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
            Upload New Track
          </a>
        </td>
      </tr>
    </table>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: 'FEATUNE - Track review update',
      html: emailWrapper(content),
    })
  } catch (error) {
    console.error('Failed to send track rejected email:', error)
  }
}

// ---------------------------------------------------------------------------
// 6. Payout Complete Email
// ---------------------------------------------------------------------------

export interface PayoutCompleteEmailParams {
  creatorEmail: string
  creatorName: string
  amount: number
}

export async function sendPayoutCompleteEmail(params: PayoutCompleteEmailParams): Promise<void> {
  const { creatorEmail, creatorName, amount } = params

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">Your payout has been processed</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;">
      Hi ${creatorName}, your payout has been completed.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#222222;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Amount Paid</span>
          <br/>
          <span style="font-size:28px;font-weight:700;color:#22C55E;">${formatCurrency(amount)}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;text-align:center;">
      The funds should appear in your account shortly.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:#FF6B00;border-radius:6px;">
          <a href="${SITE_URL}/dashboard/earnings" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
            View Earnings
          </a>
        </td>
      </tr>
    </table>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: 'FEATUNE - Your payout has been processed',
      html: emailWrapper(content),
    })
  } catch (error) {
    console.error('Failed to send payout complete email:', error)
  }
}

// ---------------------------------------------------------------------------
// 7. New Submission Email (to admin)
// ---------------------------------------------------------------------------

export interface NewSubmissionEmailParams {
  trackTitle: string
  creatorName: string
}

export async function sendNewSubmissionEmail(params: NewSubmissionEmailParams): Promise<void> {
  const { trackTitle, creatorName } = params
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@featune.com'

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">New track submission</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;">
      A new track has been submitted and is awaiting your review.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#222222;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 12px;">
                <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Track</span>
                <br/>
                <span style="font-size:16px;font-weight:600;color:#FFFFFF;">${trackTitle}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0;">
                <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Creator</span>
                <br/>
                <span style="font-size:14px;color:#A0A0A0;">${creatorName}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:#FF6B00;border-radius:6px;">
          <a href="${SITE_URL}/admin/submissions" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
            Review Submissions
          </a>
        </td>
      </tr>
    </table>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `FEATUNE - New track submission: ${trackTitle}`,
      html: emailWrapper(content),
    })
  } catch (error) {
    console.error('Failed to send new submission email:', error)
  }
}

// ---------------------------------------------------------------------------
// 8. Creator Application Email (to admin)
// ---------------------------------------------------------------------------

export interface CreatorApplicationEmailParams {
  creatorName: string
}

export async function sendCreatorApplicationEmail(params: CreatorApplicationEmailParams): Promise<void> {
  const { creatorName } = params
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@featune.com'

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">New creator application</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#A0A0A0;">
      A new creator has applied to join FEATUNE.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#222222;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <span style="font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Applicant</span>
          <br/>
          <span style="font-size:16px;font-weight:600;color:#FFFFFF;">${creatorName}</span>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:#FF6B00;border-radius:6px;">
          <a href="${SITE_URL}/admin/creators" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
            Review Applications
          </a>
        </td>
      </tr>
    </table>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `FEATUNE - New creator application: ${creatorName}`,
      html: emailWrapper(content),
    })
  } catch (error) {
    console.error('Failed to send creator application email:', error)
  }
}
