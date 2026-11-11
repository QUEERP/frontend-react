export interface CustomerEmailInvoiceSummary {
  id: string
  invoiceNumber?: string
  invoiceDate?: string | null
  dueDate?: string | null
  status?: string | null
  grandTotal?: number | string | null
  amountPaid?: number | string | null
}

export interface CustomerEmailQuotationSummary {
  id: string
  quoteNumber?: string
  issueDate?: string | null
  totalAmount?: number | string | null
}

export interface CustomerEmailFileSummary {
  name: string
  size: number
}

export interface BuildCustomerEmailHtmlParams {
  subject: string
  body: string
  businessName: string
  senderEmail: string
  businessPhone?: string | null
  businessLocation?: string | null
  businessWebsite?: string | null
  customerName: string
  toEmail: string
  currencySymbol?: string
  outstandingDues?: number
  hasInvoices?: boolean
  attachedInvoices?: CustomerEmailInvoiceSummary[]
  attachedQuotations?: CustomerEmailQuotationSummary[]
  uploadedFiles?: CustomerEmailFileSummary[]
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMoney(amount: number, currencySymbol: string): string {
  return `${currencySymbol} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatShortDate(dateValue?: string | null): string {
  if (!dateValue) return '—'
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function resolveCategoryMeta(subject: string): {
  label: string
  accentBg: string
  accentBorder: string
  accentText: string
  headerBg: string
} {
  const s = subject.toLowerCase()
  if (/reminder|overdue|pending|due|payment/.test(s)) {
    return {
      label: 'PAYMENT REMINDER',
      accentBg: '#fef3c7',
      accentBorder: '#fcd34d',
      accentText: '#92400e',
      headerBg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
    }
  }
  if (/quote|quotation|proposal|estimate/.test(s)) {
    return {
      label: 'QUOTATION & PROPOSAL',
      accentBg: '#d1fae5',
      accentBorder: '#6ee7b7',
      accentText: '#065f46',
      headerBg: 'linear-gradient(135deg, #0f172a 0%, #065f46 100%)',
    }
  }
  if (/invoice|statement|bill|receipt/.test(s)) {
    return {
      label: 'INVOICE & STATEMENT',
      accentBg: '#dbeafe',
      accentBorder: '#93c5fd',
      accentText: '#1e40af',
      headerBg: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
    }
  }
  return {
    label: 'CUSTOMER COMMUNICATION',
    accentBg: '#e0e7ff',
    accentBorder: '#a5b4fc',
    accentText: '#3730a3',
    headerBg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
  }
}

function getStatusBadgeStyle(status?: string | null): string {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'PAID') {
    return 'background-color:#dcfce7;color:#166534;border:1px solid #86efac;'
  }
  if (normalized === 'PARTIAL') {
    return 'background-color:#fef3c7;color:#92400e;border:1px solid #fcd34d;'
  }
  return 'background-color:#fee2e2;color:#991b1b;border:1px solid #fca5a5;'
}

function formatMessageParagraphs(body: string): string {
  const trimmed = (body || '').trim()
  if (!trimmed) {
    return `<p style="margin:0;color:#94a3b8;font-style:italic;font-size:14px;line-height:1.6;">No message content drafted yet.</p>`
  }
  return trimmed
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => {
      const escapedLines = escapeHtml(paragraph.trim()).replace(/\r?\n/g, '<br />')
      return `<p style="margin:0 0 14px 0;color:#1e293b;font-size:14.5px;line-height:1.7;">${escapedLines}</p>`
    })
    .join('')
}

/**
 * Generates an inline-styled, Gmail/Outlook-compatible HTML email template
 * wrapping the composed customer message, business branding, and attached document summaries.
 */
export function buildCustomerEmailHtml({
  subject,
  body,
  businessName,
  senderEmail,
  businessPhone,
  businessLocation,
  businessWebsite,
  customerName,
  toEmail,
  currencySymbol = '₹',
  outstandingDues = 0,
  hasInvoices = false,
  attachedInvoices = [],
  attachedQuotations = [],
  uploadedFiles = [],
}: BuildCustomerEmailHtmlParams): string {
  const safeBusinessName = escapeHtml(businessName || 'Our Business')
  const safeSenderEmail = escapeHtml(senderEmail || '')
  const safeCustomerName = escapeHtml(customerName || 'Valued Customer')
  const safeToEmail = escapeHtml(toEmail || '')
  const safeSubject = escapeHtml(subject || 'Account Communication')
  const initials = escapeHtml(
    (businessName || 'B')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'B'
  )

  const category = resolveCategoryMeta(subject || '')
  const todayLabel = escapeHtml(
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  )
  const preheader = escapeHtml((body || '').replace(/\s+/g, ' ').trim().slice(0, 120))
  const totalAttachments =
    attachedInvoices.length + attachedQuotations.length + uploadedFiles.length

  const invoicesBlock =
    attachedInvoices.length > 0
      ? `
      <tr>
        <td style="padding:0 32px 22px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;border-collapse:separate;">
            <tr>
              <td colspan="5" style="background-color:#f8fafc;padding:11px 16px;border-bottom:1px solid #e2e8f0;">
                <span style="font-size:11px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:#0f172a;">
                  Attached Invoices (${attachedInvoices.length})
                </span>
              </td>
            </tr>
            <tr style="background-color:#fcfcfd;">
              <th align="left" style="padding:9px 14px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Invoice #</th>
              <th align="left" style="padding:9px 10px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Date</th>
              <th align="left" style="padding:9px 10px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Status</th>
              <th align="right" style="padding:9px 10px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Total</th>
              <th align="right" style="padding:9px 14px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Balance Due</th>
            </tr>
            ${attachedInvoices
              .map((inv) => {
                const total = Number(inv.grandTotal || 0)
                const paid = Number(inv.amountPaid || 0)
                const due = Math.max(0, total - paid)
                const status = (inv.status || 'UNPAID').toUpperCase()
                return `
                  <tr>
                    <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#0f172a;font-family:Consolas,Monaco,monospace;border-bottom:1px solid #f1f5f9;">
                      ${escapeHtml(inv.invoiceNumber || 'Invoice')}
                    </td>
                    <td style="padding:10px;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">
                      ${escapeHtml(formatShortDate(inv.invoiceDate))}
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #f1f5f9;">
                      <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;${getStatusBadgeStyle(status)}">
                        ${escapeHtml(status)}
                      </span>
                    </td>
                    <td align="right" style="padding:10px;font-size:12.5px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">
                      ${escapeHtml(formatMoney(total, currencySymbol))}
                    </td>
                    <td align="right" style="padding:10px 14px;font-size:12.5px;font-weight:700;color:${due > 0 ? '#b91c1c' : '#15803d'};border-bottom:1px solid #f1f5f9;">
                      ${escapeHtml(formatMoney(due, currencySymbol))}
                    </td>
                  </tr>
                `
              })
              .join('')}
          </table>
        </td>
      </tr>
    `
      : ''

  const quotationsBlock =
    attachedQuotations.length > 0
      ? `
      <tr>
        <td style="padding:0 32px 22px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;border-collapse:separate;">
            <tr>
              <td colspan="3" style="background-color:#f8fafc;padding:11px 16px;border-bottom:1px solid #e2e8f0;">
                <span style="font-size:11px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:#0f172a;">
                  Attached Quotations (${attachedQuotations.length})
                </span>
              </td>
            </tr>
            ${attachedQuotations
              .map(
                (q) => `
                <tr>
                  <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#0f172a;font-family:Consolas,Monaco,monospace;border-bottom:1px solid #f1f5f9;">
                    ${escapeHtml(q.quoteNumber || 'Quotation')}
                  </td>
                  <td style="padding:10px 12px;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">
                    ${escapeHtml(formatShortDate(q.issueDate))}
                  </td>
                  <td align="right" style="padding:10px 16px;font-size:12.5px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">
                    ${escapeHtml(formatMoney(Number(q.totalAmount || 0), currencySymbol))}
                  </td>
                </tr>
              `
              )
              .join('')}
          </table>
        </td>
      </tr>
    `
      : ''

  const filesBlock =
    uploadedFiles.length > 0
      ? `
      <tr>
        <td style="padding:0 32px 22px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
            <tr>
              <td style="padding:12px 16px;">
                <div style="font-size:11px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:#0f172a;margin-bottom:6px;">
                  Additional Attached Documents (${uploadedFiles.length})
                </div>
                <div style="font-size:12.5px;color:#334155;line-height:1.6;">
                  ${uploadedFiles
                    .map(
                      (file) =>
                        `&bull; <strong>${escapeHtml(file.name)}</strong> <span style="color:#64748b;">(${Math.max(1, Math.round(file.size / 1024))} KB)</span>`
                    )
                    .join('<br />')}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
      : ''

  const extraFooterParts = [
    businessLocation ? escapeHtml(businessLocation) : '',
    businessPhone ? `Tel: ${escapeHtml(businessPhone)}` : '',
    businessWebsite ? escapeHtml(businessWebsite) : '',
  ].filter(Boolean)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.06);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#0f172a;background:${category.headerBg};padding:26px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:42px;height:42px;background-color:#2563eb;border-radius:11px;text-align:center;vertical-align:middle;font-size:16px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">
                          ${initials}
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <div style="font-size:16px;font-weight:800;color:#ffffff;line-height:1.2;">${safeBusinessName}</div>
                          ${safeSenderEmail ? `<div style="font-size:12px;color:#cbd5e1;margin-top:2px;">${safeSenderEmail}</div>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;background-color:${category.accentBg};color:${category.accentText};border:1px solid ${category.accentBorder};padding:4px 11px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:0.7px;text-transform:uppercase;white-space:nowrap;">
                      ${category.label}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:18px;">
                    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;line-height:1.35;letter-spacing:-0.2px;">
                      ${safeSubject}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Account Metadata Strip -->
          <tr>
            <td style="background-color:#f8fafc;border-bottom:1px solid #e2e8f0;padding:14px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:42%;vertical-align:top;padding-right:8px;">
                    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#64748b;">Prepared For</div>
                    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">${safeCustomerName}</div>
                  </td>
                  <td style="width:28%;vertical-align:top;padding-right:8px;">
                    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#64748b;">Date</div>
                    <div style="font-size:13px;font-weight:600;color:#334155;margin-top:2px;">${todayLabel}</div>
                  </td>
                  <td align="right" style="width:30%;vertical-align:top;">
                    ${
                      hasInvoices || outstandingDues > 0
                        ? `
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#64748b;">Outstanding Balance</div>
                          <div style="font-size:13.5px;font-weight:800;color:${outstandingDues > 0 ? '#b91c1c' : '#15803d'};margin-top:2px;">
                            ${escapeHtml(formatMoney(outstandingDues, currencySymbol))}
                          </div>
                        `
                        : `
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#64748b;">Attachments</div>
                          <div style="font-size:13px;font-weight:700;color:#1e40af;margin-top:2px;">
                            ${totalAttachments} file${totalAttachments === 1 ? '' : 's'}
                          </div>
                        `
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Email Body -->
          <tr>
            <td style="padding:26px 32px 14px 32px;">
              ${formatMessageParagraphs(body)}
            </td>
          </tr>

          <!-- Attached Records / Files -->
          ${invoicesBlock}
          ${quotationsBlock}
          ${filesBlock}

          <!-- Quick Reply Callout -->
          ${
            safeSenderEmail
              ? `
              <tr>
                <td style="padding:4px 32px 28px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                    <tr>
                      <td style="padding:14px 18px;vertical-align:middle;">
                        <div style="font-size:13px;font-weight:700;color:#1e3a8a;">Questions or payment confirmation?</div>
                        <div style="font-size:12px;color:#3b82f6;margin-top:2px;">Reply directly to this email or contact ${safeSenderEmail}</div>
                      </td>
                      <td align="right" style="padding:14px 18px;vertical-align:middle;white-space:nowrap;">
                        <a href="mailto:${safeSenderEmail}?subject=Re:%20${encodeURIComponent(subject || 'Your Message')}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;padding:9px 16px;border-radius:8px;">
                          Reply Now &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            `
              : ''
          }

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 32px;text-align:center;">
              <div style="font-size:12.5px;font-weight:700;color:#334155;">${safeBusinessName}</div>
              ${
                extraFooterParts.length > 0
                  ? `<div style="font-size:11.5px;color:#64748b;margin-top:3px;">${extraFooterParts.join(' &bull; ')}</div>`
                  : ''
              }
              <div style="font-size:11px;color:#94a3b8;margin-top:8px;">
                Sent to ${safeToEmail || 'customer'} regarding ${safeCustomerName}.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

