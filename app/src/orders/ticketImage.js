import { dateLong, formatDate, rupiah, statusOf, todayIso } from '../shared/utils.js'

// E-tiket diunduh sebagai PNG supaya tetap terbaca tanpa koneksi dan tidak
// butuh library PDF tambahan. Semua digambar manual di <canvas>.
const WIDTH = 720
const PAD = 40
const CARD_X = PAD
const CARD_W = WIDTH - PAD * 2
const INSET = 36
const CX = CARD_X + INSET
const CW = CARD_W - INSET * 2
const MAX_HEIGHT = 1600

const COLORS = {
  page: '#f5f1e8',
  surface: '#fffdf9',
  ink: '#201c17',
  muted: '#6e6558',
  line: '#e6ddcf',
  brand: '#c0492b',
  brandInk: '#8a2f16',
  brandSoft: '#f7e4db',
  barcode: '#fbf7ef',
}

const PILL_TONES = {
  ok: { bg: COLORS.brandSoft, fg: COLORS.brandInk },
  muted: { bg: '#f1e9dd', fg: COLORS.muted },
  info: { bg: '#e8f1fd', fg: '#1c5aa8' },
}

const FONT_STACK =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

const font = (weight, size, family = FONT_STACK) => `${weight} ${size}px ${family}`

function roundRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function setLetterSpacing(ctx, value) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = value
}

function fitText(ctx, value, maxWidth) {
  const text = String(value ?? '')
  if (!text || ctx.measureText(text).width <= maxWidth) return text
  let cut = text
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
  return `${cut}…`
}

function wrapText(ctx, value, maxWidth, maxLines = 2) {
  const words = String(value ?? '')
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return ['']

  const lines = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)

  if (lines.length <= maxLines) return lines.map((line) => fitText(ctx, line, maxWidth))

  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
  kept[maxLines - 1] = `${last}…`
  return kept
}

// Pola bar deterministik dari kode booking, sama seperti barcode di layar.
function barcodeBars(code) {
  const safe = String(code ?? 'TRIPDESK') || 'TRIPDESK'
  return Array.from({ length: 52 }, (_, index) => {
    const charCode = safe.charCodeAt(index % safe.length)
    return 2 + ((charCode + index * 5) % 3)
  })
}

function pickupText(booking) {
  const point = booking?.pickupPoint ?? {}
  return point.time ? `${point.time} · ${point.name}` : point.name ?? '-'
}

function pickupNote(booking) {
  const point = booking?.pickupPoint ?? {}
  if (point.time) {
    return `Jemput ${point.time} di ${point.name}. Datang 10 menit sebelum jam jemput. Tunjukkan e-tiket ini saat naik armada.`
  }
  return `Datang 15 menit sebelum keberangkatan di ${point.name ?? 'titik jemput'}. Tunjukkan e-tiket ini saat naik armada.`
}

function drawBrand(ctx, booking, status, tone, top) {
  ctx.save()
  roundRect(ctx, CX, top, 38, 38, 11)
  ctx.fillStyle = COLORS.brand
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = font(800, 21)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('T', CX + 19, top + 21)
  ctx.restore()

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = COLORS.ink
  ctx.font = font(800, 23)
  ctx.fillText('Tripdesk', CX + 50, top + 20)

  setLetterSpacing(ctx, '1.6px')
  ctx.fillStyle = COLORS.muted
  ctx.font = font(700, 9)
  ctx.fillText('E-TIKET TRAVEL ANTARKOTA', CX + 51, top + 35)
  setLetterSpacing(ctx, '0px')

  ctx.font = font(700, 11)
  const label = status.label
  const pillW = ctx.measureText(label).width + 26
  roundRect(ctx, CX + CW - pillW, top + 4, pillW, 26, 13)
  ctx.fillStyle = tone.bg
  ctx.fill()
  ctx.fillStyle = tone.fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, CX + CW - pillW / 2, top + 18)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function drawRoute(ctx, booking, top) {
  const colWidth = 190
  ctx.textAlign = 'left'
  ctx.fillStyle = COLORS.ink
  ctx.font = font(800, 30)
  ctx.fillText(booking.departTime, CX, top + 28)

  ctx.fillStyle = COLORS.muted
  ctx.font = font(500, 12.5)
  ctx.fillText(fitText(ctx, booking.origin, colWidth), CX, top + 48)

  ctx.textAlign = 'right'
  ctx.fillStyle = COLORS.ink
  ctx.font = font(800, 30)
  ctx.fillText(booking.arriveTime, CX + CW, top + 28)

  ctx.fillStyle = COLORS.muted
  ctx.font = font(500, 12.5)
  ctx.fillText(fitText(ctx, booking.destination, colWidth), CX + CW, top + 48)

  const lineLeft = CX + colWidth + 10
  const lineRight = CX + CW - colWidth - 10
  ctx.save()
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 1.4
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(lineLeft, top + 10)
  ctx.lineTo(lineRight, top + 10)
  ctx.stroke()
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.muted
  ctx.font = font(600, 9.5)
  ctx.fillText(fitText(ctx, dateLong(booking.date), lineRight - lineLeft), (lineLeft + lineRight) / 2, top + 30)
  ctx.textAlign = 'left'
}

function drawDivider(ctx, y) {
  ctx.save()
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 1.6
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.moveTo(CARD_X + 14, y)
  ctx.lineTo(CARD_X + CARD_W - 14, y)
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = COLORS.page
  ctx.beginPath()
  ctx.arc(CARD_X, y, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(CARD_X + CARD_W, y, 12, 0, Math.PI * 2)
  ctx.fill()
}

function drawDetails(ctx, booking, top) {
  const rows = [
    [
      { label: 'Tanggal', value: dateLong(booking.date) },
      { label: 'Kursi', value: (booking.seats ?? []).join(', ') },
    ],
    [
      { label: 'Penumpang', value: booking.passenger?.name },
      { label: 'Armada', value: booking.fleet },
    ],
    [
      { label: 'Titik jemput', value: pickupText(booking) },
      { label: 'Total bayar', value: rupiah(booking.total), strong: true },
    ],
  ]

  const colWidth = CW / 2 - 16
  let y = top

  rows.forEach((row) => {
    let lineCount = 1
    row.forEach((cell, index) => {
      const x = CX + index * (CW / 2)
      ctx.font = font(600, 10)
      ctx.fillStyle = COLORS.muted
      ctx.fillText(cell.label, x, y)

      ctx.font = cell.strong ? font(800, 15) : font(600, 12.5)
      ctx.fillStyle = cell.strong ? COLORS.brandInk : COLORS.ink
      const lines = wrapText(ctx, cell.value, colWidth, 2)
      lines.forEach((line, lineIndex) => ctx.fillText(line, x, y + 20 + lineIndex * 17))
      lineCount = Math.max(lineCount, lines.length)
    })
    y += 20 + lineCount * 17 + 14
  })

  return y
}

function drawBarcode(ctx, booking, top) {
  const boxH = 92
  roundRect(ctx, CX, top, CW, boxH, 14)
  ctx.fillStyle = COLORS.barcode
  ctx.fill()

  const widths = barcodeBars(booking.code)
  const gap = 2.5
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1)
  let x = CX + (CW - total) / 2
  ctx.fillStyle = COLORS.ink
  widths.forEach((width) => {
    ctx.fillRect(x, top + 16, width, 46)
    x += width + gap
  })

  setLetterSpacing(ctx, '2.4px')
  ctx.font = font(600, 10, MONO_STACK)
  ctx.fillStyle = COLORS.muted
  ctx.textAlign = 'center'
  ctx.fillText(booking.code, CX + CW / 2, top + 80)
  setLetterSpacing(ctx, '0px')
  ctx.textAlign = 'left'

  return top + boxH
}

function drawFooter(ctx, booking, top) {
  let y = top + 24
  ctx.font = font(500, 11)
  ctx.fillStyle = COLORS.muted
  const lines = wrapText(ctx, pickupNote(booking), CW, 3)
  lines.forEach((line, index) => ctx.fillText(line, CX, y + index * 16))
  y += lines.length * 16 + 12

  setLetterSpacing(ctx, '0.4px')
  ctx.font = font(600, 9)
  ctx.fillStyle = COLORS.muted
  ctx.fillText(`Diunduh ${formatDate(todayIso())} · Tripdesk`, CX, y)
  setLetterSpacing(ctx, '0px')

  return y + 34
}

function drawWatermark(ctx, booking, cardBottom) {
  if (booking.status !== 'dibatalkan' && booking.status !== 'selesai') return
  const cancelled = booking.status === 'dibatalkan'
  ctx.save()
  ctx.translate(CARD_X + CARD_W / 2, (PAD + cardBottom) / 2)
  ctx.rotate(-0.3)
  ctx.font = font(800, 66)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = cancelled ? 'rgba(182, 56, 47, 0.08)' : 'rgba(28, 90, 168, 0.07)'
  ctx.fillText(cancelled ? 'DIBATALKAN' : 'SELESAI', 0, 0)
  ctx.restore()
}

function drawContent(ctx, booking, status, tone) {
  let y = PAD + 34

  drawBrand(ctx, booking, status, tone, y)
  y += 38 + 34

  setLetterSpacing(ctx, '1.4px')
  ctx.font = font(700, 9.5)
  ctx.fillStyle = COLORS.muted
  ctx.fillText('KODE BOOKING', CX, y)
  setLetterSpacing(ctx, '0px')

  ctx.font = font(800, 34, MONO_STACK)
  ctx.fillStyle = COLORS.ink
  ctx.fillText(fitText(ctx, booking.code, CW), CX, y + 36)
  y += 36 + 40

  drawRoute(ctx, booking, y)
  y += 48 + 30

  drawDivider(ctx, y)
  y += 38

  y = drawDetails(ctx, booking, y)
  y += 6
  y = drawBarcode(ctx, booking, y)
  return drawFooter(ctx, booking, y)
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Menggambar e-tiket ke canvas baru (ukuran CSS 720px, dilipatgandakan
 * `pixelRatio` supaya tajam di layar HP).
 */
export function renderTicketCanvas(booking, { pixelRatio = 2 } = {}) {
  if (!booking) throw new Error('Data pesanan tidak tersedia.')

  const ratio = pixelRatio
  const status = statusOf(booking.status)
  const tone = PILL_TONES[status.tone] ?? PILL_TONES.muted

  const layer = createCanvas(WIDTH * ratio, MAX_HEIGHT * ratio)
  const layerCtx = layer.getContext('2d')
  layerCtx.scale(ratio, ratio)
  const cardBottom = drawContent(layerCtx, booking, status, tone)

  const height = Math.ceil(cardBottom + PAD)
  const out = createCanvas(WIDTH * ratio, height * ratio)
  const ctx = out.getContext('2d')

  ctx.fillStyle = COLORS.page
  ctx.fillRect(0, 0, out.width, out.height)

  ctx.save()
  ctx.scale(ratio, ratio)
  ctx.save()
  ctx.shadowColor = 'rgba(32, 28, 23, 0.10)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 12
  roundRect(ctx, CARD_X, PAD, CARD_W, height - PAD * 2, 26)
  ctx.fillStyle = COLORS.surface
  ctx.fill()
  ctx.restore()

  roundRect(ctx, CARD_X, PAD, CARD_W, height - PAD * 2, 26)
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 1
  ctx.stroke()

  drawWatermark(ctx, booking, cardBottom)
  ctx.restore()

  // Tempelkan isi tiket di atas kartu. Area transparan di luar kartu tidak
  // ikut terpakai karena canvas hasil sudah dipotong setinggi kartu.
  ctx.drawImage(layer, 0, 0, WIDTH * ratio, height * ratio, 0, 0, WIDTH * ratio, height * ratio)

  return out
}

export function ticketFilename(booking) {
  const code = String(booking?.code ?? 'tiket').replace(/[^A-Za-z0-9-]+/g, '-')
  return `Tripdesk-${code}.png`
}

/**
 * Mengunduh e-tiket sebagai berkas PNG. Melempar Error kalau browser gagal
 * membuat berkas, supaya halaman bisa menampilkan pesan.
 */
export async function downloadTicket(booking) {
  if (typeof document === 'undefined') throw new Error('Unduh tiket hanya bisa dari browser.')

  const canvas = renderTicketCanvas(booking)
  const filename = ticketFilename(booking)

  const blob = await new Promise((resolve, reject) => {
    try {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error('Browser gagal membuat berkas tiket.'))
      }, 'image/png')
    } catch (error) {
      reject(error)
    }
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)

  return filename
}
