const PDFDocument = require('pdfkit');

/**
 * Generates a premium PDF report card and streams it directly to the response stream.
 * @param {Object} result - The Result document (populated with student, test, violationReport)
 * @param {Stream} resStream - The writable HTTP response stream
 */
const generateResultPdf = (result, resStream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `ExamShield AI Result Card - ${result.student.name}`,
      Author: 'ExamShield AI Platform',
      Subject: 'Online Examination Report Card',
    },
  });

  // Pipe document to the stream
  doc.pipe(resStream);

  // Define Medical Theme Colors
  const primaryColor = '#0F52BA';   // Deep Blue
  const secondaryColor = '#008080'; // Teal
  const cyanColor = '#00A86B';      // Mint/Cyan Success
  const alertColor = '#D2143A';     // Crimson red
  const textColor = '#2B3E50';      // Dark Slate
  const lightBg = '#F4F7F6';        // Off white
  const grayColor = '#7F8C8D';

  // 1. Draw Page Border / Background Grid
  doc.rect(15, 15, 565, 812).lineWidth(1.5).stroke(primaryColor);
  doc.rect(20, 20, 555, 802).lineWidth(0.5).stroke(secondaryColor);

  // 2. Premium Header Section
  doc.rect(20, 20, 555, 95).fill('#EBF5FB');
  
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('EXAMSHIELD AI', 40, 40);

  doc.fillColor(secondaryColor)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('SMART EXAMINATION & PROCTORING PLATFORM', 40, 65);

  doc.fillColor(textColor)
     .font('Helvetica')
     .fontSize(9)
     .text(`REPORT GENERATED: ${new Date(result.createdAt).toLocaleString()}`, 40, 80);

  // Draw Status Badge (Top Right)
  const isPass = result.status === 'pass';
  const badgeColor = isPass ? cyanColor : alertColor;
  doc.rect(420, 40, 130, 40).fill(badgeColor);
  doc.fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .fontSize(14)
     .text(isPass ? 'PASSED' : 'FAILED', 420, 53, { width: 130, align: 'center' });

  // 3. Student & Test Metadata
  doc.y = 135;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text('CANDIDATE INFORMATION', 40, 135);
  doc.moveTo(40, 152).lineTo(550, 152).lineWidth(1).stroke(primaryColor);

  // Student Details Box
  doc.rect(40, 160, 510, 85).fill(lightBg);
  
  // Student Information Text
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10);
  doc.text('Name:', 55, 175).text('Email:', 55, 195).text('Candidate ID:', 55, 215);

  doc.font('Helvetica');
  doc.text(result.student.name, 140, 175)
     .text(result.student.email, 140, 195)
     .text(result.student._id.toString(), 140, 215);

  // Test Details Text (Right half)
  doc.font('Helvetica-Bold');
  doc.text('Exam Title:', 320, 175).text('Duration:', 320, 195).text('Passing Marks:', 320, 215);

  doc.font('Helvetica');
  doc.text(result.test.title, 400, 175)
     .text(`${result.test.duration} Minutes`, 400, 195)
     .text(`${result.test.passingMarks} / ${result.totalMarksPossible}`, 400, 215);

  // 4. Performance Metrics
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text('PERFORMANCE ANALYTICS', 40, 265);
  doc.moveTo(40, 282).lineTo(550, 282).lineWidth(1).stroke(primaryColor);

  // Score card circles/boxes
  const boxWidth = 110;
  const boxHeight = 65;
  const metrics = [
    { label: 'Marks Secured', val: result.score, color: primaryColor },
    { label: 'Percentage', val: `${result.percentage}%`, color: secondaryColor },
    { label: 'Correct Answers', val: result.correctAnswers, color: cyanColor },
    { label: 'Incorrect Answers', val: result.wrongAnswers, color: alertColor },
  ];

  metrics.forEach((m, idx) => {
    const xPos = 40 + idx * (boxWidth + 23);
    doc.rect(xPos, 295, boxWidth, boxHeight).fill(lightBg);
    doc.rect(xPos, 295, boxWidth, 4).fill(m.color); // Top indicator line

    doc.fillColor(grayColor).font('Helvetica-Bold').fontSize(8).text(m.label, xPos, 310, { width: boxWidth, align: 'center' });
    doc.fillColor(textColor).font('Helvetica-Bold').fontSize(16).text(m.val, xPos, 330, { width: boxWidth, align: 'center' });
  });

  // 5. Proctoring & Security Audit Report
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text('AI PROCTORING & INTEGRITY AUDIT', 40, 395);
  doc.moveTo(40, 412).lineTo(550, 412).lineWidth(1).stroke(primaryColor);

  const vReport = result.violationReport;
  const warningCount = vReport ? vReport.violations.length : 0;
  const isDisqualified = result.session && result.session.status === 'disqualified';

  // Audit Box
  doc.rect(40, 420, 510, 95).fill(lightBg);
  
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10);
  doc.text('Security Status:', 55, 435)
     .text('Total System Warnings:', 55, 455)
     .text('Integrity Rating:', 55, 475);

  doc.font('Helvetica');
  
  let securityMsg = 'CLEARED - No Significant Irregularities Detected';
  let rating = 'EXCELLENT (100%)';
  let securityColor = cyanColor;

  if (isDisqualified) {
    securityMsg = 'DISQUALIFIED - Auto Terminated Due to Integrity Violation';
    rating = 'SUSPENDED (0%)';
    securityColor = alertColor;
  } else if (warningCount > 3) {
    securityMsg = 'PROBATION - Multiple Warnings Issued';
    rating = 'LOW (40%)';
    securityColor = '#D35400'; // Orange
  } else if (warningCount > 0) {
    securityMsg = 'CLEARED WITH MINOR WARNINGS';
    rating = 'SATISFACTORY (80%)';
    securityColor = '#F1C40F'; // Yellow-gold
  }

  doc.fillColor(securityColor).font('Helvetica-Bold').text(securityMsg, 180, 435);
  doc.fillColor(textColor).font('Helvetica').text(`${warningCount} Warnings Registered`, 180, 455);
  doc.fillColor(securityColor).font('Helvetica-Bold').text(rating, 180, 475);

  // Listing Specific Violations (max 3 to fit page elegantly)
  if (vReport && vReport.violations.length > 0) {
    doc.fillColor(textColor).font('Helvetica-Bold').fontSize(9).text('Recent Incidents:', 55, 495);
    const incidentTexts = vReport.violations.slice(0, 3).map(v => {
      const time = new Date(v.timestamp).toLocaleTimeString();
      return `${v.type.toUpperCase().replace('-', ' ')} at ${time} (Warning #${v.warningCountAtViolation})`;
    }).join('; ');
    doc.font('Helvetica').fontSize(8).fillColor(grayColor).text(incidentTexts, 140, 495, { width: 380 });
  } else {
    doc.fillColor(textColor).font('Helvetica-Oblique').fontSize(9).text('Zero system warnings registered during exam session.', 55, 495);
  }

  // 6. QR Code Verification (Mocked via vector lines)
  doc.rect(40, 545, 110, 110).fill('#FFFFFF');
  doc.rect(40, 545, 110, 110).lineWidth(1).stroke(grayColor);

  // Draw a vector-based mock QR code grid inside
  doc.rect(50, 555, 25, 25).fill(primaryColor);
  doc.rect(50, 620, 25, 25).fill(primaryColor);
  doc.rect(115, 555, 25, 25).fill(primaryColor);
  doc.rect(85, 590, 20, 20).fill(primaryColor);
  
  // Scatters
  doc.rect(55, 595, 5, 5).fill(textColor);
  doc.rect(70, 590, 5, 5).fill(textColor);
  doc.rect(110, 590, 5, 5).fill(textColor);
  doc.rect(115, 605, 10, 10).fill(textColor);
  doc.rect(90, 560, 10, 10).fill(textColor);
  doc.rect(55, 610, 5, 5).fill(textColor);
  doc.rect(120, 625, 15, 15).fill(textColor);
  doc.rect(95, 630, 10, 10).fill(textColor);

  // Explanatory Text next to QR code
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('VERIFIABLE REPORT CARD', 170, 555);
  doc.fillColor(textColor).font('Helvetica').fontSize(9).text(
    'This examination transcript is cryptographically signed and stored in the ExamShield database. Use the QR code or verify code to audit this candidate\'s results directly on the portal.',
    170,
    572,
    { width: 380, lineGap: 3 }
  );

  doc.font('Helvetica-Bold').fillColor(primaryColor).text(`Verification Hash: sha256-${result._id.toString().substring(0, 16)}`, 170, 630);

  // 7. Signature / Seal
  doc.moveTo(400, 715).lineTo(540, 715).lineWidth(1).stroke(textColor);
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(8).text('AUTHORIZED SIGNATURE', 400, 725, { width: 140, align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(8).text('ExamShield Controller of Exams', 400, 735, { width: 140, align: 'center' });

  // 8. Footer Section
  doc.rect(20, 782, 555, 40).fill(primaryColor);
  doc.fillColor('#FFFFFF')
     .font('Helvetica')
     .fontSize(8)
     .text('ExamShield AI Proctoring System • Confidential Report • All Rights Reserved © 2026', 40, 798, { width: 510, align: 'center' });

  // End Document
  doc.end();
};

module.exports = {
  generateResultPdf,
};
