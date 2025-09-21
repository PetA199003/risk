import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: string;
  role?: string;
  signature?: string;
  signedAt?: string;
}

interface Project {
  id: string;
  title: string;
  location: string;
  eventStart: string;
  eventEnd: string;
  description?: string;
}

export async function generateParticipantListPDF(
  project: Project,
  participants: Participant[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = height - 50;
  const margin = 50;
  const lineHeight = 20;
  
  // Header
  page.drawText('Teilnehmerliste', {
    x: margin,
    y: yPosition,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 40;
  
  // Project information
  page.drawText(`Projekt: ${project.title}`, {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  
  yPosition -= lineHeight;
  
  page.drawText(`Ort: ${project.location}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: font,
  });
  
  yPosition -= lineHeight;
  
  const eventDate = format(new Date(project.eventStart), 'dd.MM.yyyy', { locale: de });
  page.drawText(`Datum: ${eventDate}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: font,
  });
  
  yPosition -= 30;
  
  // Table header
  const tableHeaders = ['Nr.', 'Name', 'Firma', 'Rolle', 'Unterschrift'];
  const columnWidths = [40, 150, 120, 100, 120];
  let xPosition = margin;
  
  // Draw table header
  tableHeaders.forEach((header, index) => {
    page.drawText(header, {
      x: xPosition,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    xPosition += columnWidths[index];
  });
  
  // Draw header line
  page.drawLine({
    start: { x: margin, y: yPosition - 5 },
    end: { x: width - margin, y: yPosition - 5 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 25;
  
  // Table rows
  participants.forEach((participant, index) => {
    if (yPosition < 100) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }
    
    xPosition = margin;
    
    // Row number
    page.drawText(`${index + 1}`, {
      x: xPosition,
      y: yPosition,
      size: 10,
      font: font,
    });
    xPosition += columnWidths[0];
    
    // Name
    const fullName = `${participant.firstName} ${participant.lastName}`;
    page.drawText(fullName, {
      x: xPosition,
      y: yPosition,
      size: 10,
      font: font,
    });
    xPosition += columnWidths[1];
    
    // Company
    page.drawText(participant.company || '-', {
      x: xPosition,
      y: yPosition,
      size: 10,
      font: font,
    });
    xPosition += columnWidths[2];
    
    // Role
    page.drawText(participant.role || '-', {
      x: xPosition,
      y: yPosition,
      size: 10,
      font: font,
    });
    xPosition += columnWidths[3];
    
    // Signature status
    if (participant.signature) {
      page.drawText('✓ Unterschrieben', {
        x: xPosition,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0.5, 0),
      });
      
      if (participant.signedAt) {
        const signedDate = format(new Date(participant.signedAt), 'dd.MM.yyyy HH:mm', { locale: de });
        page.drawText(signedDate, {
          x: xPosition,
          y: yPosition - 12,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    } else {
      // Draw signature line
      page.drawLine({
        start: { x: xPosition, y: yPosition - 5 },
        end: { x: xPosition + 100, y: yPosition - 5 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
    }
    
    yPosition -= 30;
  });
  
  // Footer
  const currentDate = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de });
  page.drawText(`Erstellt am: ${currentDate}`, {
    x: margin,
    y: 30,
    size: 10,
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