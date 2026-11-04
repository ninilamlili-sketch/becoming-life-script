/** Lazy-loaded export — html-to-image handles modern CSS better than html2canvas. */

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function toPngDataUrl(el: HTMLElement) {
  const { toPng } = await import('html-to-image')
  // Filter out external stylesheets that may inject unsupported color fns into clone
  return toPng(el, {
    cacheBust: true,
    pixelRatio: Math.min(2, window.devicePixelRatio || 2),
    backgroundColor: '#F8F7F2',
    style: {
      // ensure root uses hex while cloning
      backgroundColor: '#F8F7F2',
      color: '#393A35',
    },
    filter: (node) => {
      if (node instanceof HTMLElement && node.dataset?.exportIgnore === '1') {
        return false
      }
      return true
    },
  })
}

export async function exportElementPng(
  el: HTMLElement,
  filename = 'becoming-内在探索地图.png',
) {
  const dataUrl = await toPngDataUrl(el)
  downloadDataUrl(filename, dataUrl)
  return dataUrl
}

export async function exportElementPdf(
  el: HTMLElement,
  filename = 'becoming-内在探索地图.pdf',
) {
  const dataUrl = await toPngDataUrl(el)
  const { jsPDF } = await import('jspdf')

  // Measure image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 8
  const usableW = pageW - margin * 2
  const imgW = usableW
  const imgH = (img.height * imgW) / img.width

  let heightLeft = imgH
  let y = margin
  pdf.addImage(dataUrl, 'PNG', margin, y, imgW, imgH)
  heightLeft -= pageH - margin * 2

  while (heightLeft > 12) {
    y = margin - (imgH - heightLeft)
    pdf.addPage()
    pdf.addImage(dataUrl, 'PNG', margin, y, imgW, imgH)
    heightLeft -= pageH - margin * 2
  }

  // Prefer blob save for environments that swallow <a download>
  const blob = pdf.output('blob')
  downloadBlob(filename, blob)
}
