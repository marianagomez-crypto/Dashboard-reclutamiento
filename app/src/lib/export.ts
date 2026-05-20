'use client';

// Exportadores cliente (Excel + PDF). Usa lazy import para no aumentar el bundle inicial.

export async function exportToExcel<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (rows.length === 0) return;
  const xlsx = await import('xlsx');
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Datos');
  xlsx.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToPdf(options: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  subtitle?: string;
}) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.setTextColor('#212469');
  doc.text(options.title, 14, 16);
  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor('#666');
    doc.text(options.subtitle, 14, 22);
  }
  autoTable(doc, {
    head: [options.columns],
    body: options.rows.map((r) => r.map(String)),
    startY: options.subtitle ? 26 : 22,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [49, 53, 156], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  doc.save(
    `${options.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}.pdf`,
  );
}
