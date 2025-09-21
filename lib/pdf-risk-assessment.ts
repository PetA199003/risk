import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface RiskAssessment {
  id: string;
  activity: string;
  process: string;
  hazard: string;
  hazardFactors: string;
  severity: number;
  probability: number;
  riskValue: number;
  substitution: boolean;
  technical: boolean;
  organizational: boolean;
  personal: boolean;
  measures: string;
  severityAfter: number;
  probabilityAfter: number;
  residualRisk: number;
  group?: string;
}

interface Project {
  id: string;
  title: string;
  location: string;
  eventStart: string;
  eventEnd: string;
  description?: string;
}

export async function generateRiskAssessmentPDF(
  project: Project,
  assessments: RiskAssessment[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = height - 40;
  const margin = 30;
  const lineHeight = 16;
  
  // Header
  page.drawText('Gefährdungsbeurteilung:', {
    x: width / 2 - 80,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(project.title, {
    x: width / 2 + 50,
    y: yPosition,
    size: 14,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 40;
  
  // Risk Assessment Legend Box
  const legendBoxX = width / 2 - 200;
  const legendBoxY = yPosition - 80;
  const legendBoxWidth = 400;
  const legendBoxHeight = 80;
  
  // Draw legend box border
  page.drawRectangle({
    x: legendBoxX,
    y: legendBoxY,
    width: legendBoxWidth,
    height: legendBoxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  // Legend headers
  page.drawText('Schadensschwere', {
    x: legendBoxX + 20,
    y: legendBoxY + 60,
    size: 10,
    font: boldFont,
  });
  
  page.drawText('(S 1-3)', {
    x: legendBoxX + 20,
    y: legendBoxY + 45,
    size: 9,
    font: font,
  });
  
  page.drawText('Wahrscheinlichkeit', {
    x: legendBoxX + 200,
    y: legendBoxY + 60,
    size: 10,
    font: boldFont,
  });
  
  page.drawText('(W 1-3)', {
    x: legendBoxX + 200,
    y: legendBoxY + 45,
    size: 9,
    font: font,
  });
  
  // Severity levels with colors
  const severityColors = [
    { color: rgb(0, 1, 0), text: '1 Leichte Verletzungen /' },
    { color: rgb(1, 1, 0), text: '2 Mittlere Verletzungen /' },
    { color: rgb(1, 0, 0), text: '3 Schwere' }
  ];
  
  severityColors.forEach((item, index) => {
    const y = legendBoxY + 30 - (index * 10);
    
    // Color box
    page.drawRectangle({
      x: legendBoxX + 10,
      y: y - 2,
      width: 8,
      height: 8,
      color: item.color,
    });
    
    // Text
    page.drawText(item.text, {
      x: legendBoxX + 22,
      y: y,
      size: 8,
      font: font,
    });
  });
  
  // Probability levels with colors
  const probabilityColors = [
    { color: rgb(0, 1, 0), text: '1 unwah' },
    { color: rgb(1, 1, 0), text: '2 wahrs' },
    { color: rgb(1, 0, 0), text: '3 sehr' }
  ];
  
  probabilityColors.forEach((item, index) => {
    const y = legendBoxY + 30 - (index * 10);
    
    // Color box
    page.drawRectangle({
      x: legendBoxX + 190,
      y: y - 2,
      width: 8,
      height: 8,
      color: item.color,
    });
    
    // Text
    page.drawText(item.text, {
      x: legendBoxX + 202,
      y: y,
      size: 8,
      font: font,
    });
  });
  
  // STOP Principle Box
  const stopBoxX = width - 250;
  const stopBoxY = legendBoxY;
  const stopBoxWidth = 200;
  const stopBoxHeight = 80;
  
  // STOP box background
  page.drawRectangle({
    x: stopBoxX,
    y: stopBoxY,
    width: stopBoxWidth,
    height: stopBoxHeight,
    color: rgb(0.9, 0.95, 1),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  // STOP title
  page.drawText('STOP-PRINZIP', {
    x: stopBoxX + 60,
    y: stopBoxY + 65,
    size: 12,
    font: boldFont,
  });
  
  page.drawText('SAFETY LEVEL', {
    x: stopBoxX + 120,
    y: stopBoxY + 50,
    size: 8,
    font: font,
  });
  
  // STOP levels
  const stopLevels = [
    { letter: 'S', text: 'Substitution durch\nsichere Optionen', level: '++++' },
    { letter: 'T', text: 'Technische Lösungen', level: '+++' },
    { letter: 'O', text: 'Organisatorische und\nfunktionelle Lösungen', level: '++' },
    { letter: 'P', text: 'Persönliche Schutzausrüstung', level: '+' }
  ];
  
  stopLevels.forEach((item, index) => {
    const y = stopBoxY + 35 - (index * 8);
    
    // Letter
    page.drawText(item.letter, {
      x: stopBoxX + 10,
      y: y,
      size: 10,
      font: boldFont,
      color: rgb(1, 0.5, 0),
    });
    
    // Text
    page.drawText(item.text.split('\n')[0], {
      x: stopBoxX + 25,
      y: y,
      size: 7,
      font: font,
    });
    
    if (item.text.includes('\n')) {
      page.drawText(item.text.split('\n')[1], {
        x: stopBoxX + 25,
        y: y - 6,
        size: 7,
        font: font,
      });
    }
    
    // Level indicators
    page.drawText(item.level, {
      x: stopBoxX + 160,
      y: y,
      size: 8,
      font: font,
      color: rgb(1, 0.5, 0),
    });
  });
  
  // Risk formula
  page.drawText('Risikobewertungsformel', {
    x: legendBoxX + 20,
    y: legendBoxY - 15,
    size: 9,
    font: font,
  });
  
  page.drawText('S² * W', {
    x: legendBoxX + 150,
    y: legendBoxY - 15,
    size: 12,
    font: boldFont,
  });
  
  yPosition = legendBoxY - 50;
  
  // Table headers
  const tableY = yPosition;
  const rowHeight = 20;
  const colWidths = [30, 80, 80, 100, 120, 25, 25, 25, 25, 25, 25, 25, 25, 100, 25, 25, 25];
  let xPos = margin;
  
  const headers = [
    'Pos.', 'Tätigkeit', 'Vorgang', 'Gefährdung', 'Gefährdungs- und\nBelastungsfaktoren',
    'Schadensschwere/\nGefährdung', 'Wahrscheinlichkeit', 'Risikobewertung', 'Substitution', 'Technisch',
    'Organisatorisch', 'Persönlich', 'Maßnahmen', 'S', 'W', 'R'
  ];
  
  // Draw table header background
  page.drawRectangle({
    x: margin,
    y: tableY - rowHeight,
    width: width - 2 * margin,
    height: rowHeight,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  // Draw header text
  headers.forEach((header, index) => {
    if (index < colWidths.length) {
      const cellWidth = colWidths[index];
      
      // Draw vertical lines
      page.drawLine({
        start: { x: xPos, y: tableY },
        end: { x: xPos, y: tableY - rowHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Header text
      const lines = header.split('\n');
      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: xPos + 2,
          y: tableY - 8 - (lineIndex * 8),
          size: 7,
          font: boldFont,
        });
      });
      
      xPos += cellWidth;
    }
  });
  
  // Draw final vertical line
  page.drawLine({
    start: { x: xPos, y: tableY },
    end: { x: xPos, y: tableY - rowHeight },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  // Draw horizontal line under header
  page.drawLine({
    start: { x: margin, y: tableY - rowHeight },
    end: { x: width - margin, y: tableY - rowHeight },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  // Table rows
  let currentY = tableY - rowHeight;
  
  assessments.forEach((assessment, index) => {
    currentY -= rowHeight;
    
    // Check if we need a new page
    if (currentY < 50) {
      const newPage = pdfDoc.addPage([842, 595]);
      currentY = height - 50;
    }
    
    xPos = margin;
    
    // Row background (alternating)
    if (index % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: currentY,
        width: width - 2 * margin,
        height: rowHeight,
        color: rgb(0.95, 0.95, 0.95),
      });
    }
    
    const rowData = [
      (index + 1).toString(),
      assessment.activity,
      assessment.process || '-',
      assessment.hazard,
      assessment.hazardFactors || '-',
      assessment.severity.toString(),
      assessment.probability.toString(),
      assessment.riskValue.toString(),
      assessment.substitution ? '✓' : '-',
      assessment.technical ? '✓' : '-',
      assessment.organizational ? '✓' : '-',
      assessment.personal ? '✓' : '-',
      assessment.measures || '-',
      assessment.severityAfter.toString(),
      assessment.probabilityAfter.toString(),
      assessment.residualRisk.toString()
    ];
    
    rowData.forEach((data, colIndex) => {
      if (colIndex < colWidths.length) {
        const cellWidth = colWidths[colIndex];
        
        // Draw vertical lines
        page.drawLine({
          start: { x: xPos, y: currentY + rowHeight },
          end: { x: xPos, y: currentY },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        
        // Cell text (truncated if too long)
        let displayText = data;
        if (displayText.length > cellWidth / 4) {
          displayText = displayText.substring(0, Math.floor(cellWidth / 4)) + '...';
        }
        
        page.drawText(displayText, {
          x: xPos + 2,
          y: currentY + 6,
          size: 7,
          font: font,
        });
        
        xPos += cellWidth;
      }
    });
    
    // Draw final vertical line
    page.drawLine({
      start: { x: xPos, y: currentY + rowHeight },
      end: { x: xPos, y: currentY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Draw horizontal line under row
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  });
  
  // Footer
  const currentDate = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de });
  page.drawText(`Erstellt am: ${currentDate}`, {
    x: margin,
    y: 20,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText(`Projekt: ${project.title} | Ort: ${project.location}`, {
    x: width - 300,
    y: 20,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return await pdfDoc.save();
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}