const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Register fonts once (can be at top of file or in a separate font loader)
const notoDevanagari = path.join(__dirname, '../fonts/static/NotoSansDevanagari-Regular.ttf');

class PdfService {
    async generateBookingSlip(data) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                bufferPages: true,
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            try {
                // Register Hindi font
                doc.registerFont('NotoDevanagari', notoDevanagari);
                doc.font('NotoDevanagari'); // set as default for Hindi text

                // ───────────────────────────────
                // Header with Company Info
                // ───────────────────────────────
                // Company name from data or default
                const companyName = data.companyName || 'STC FREIGHT';
                const companyAddress = data.companyAddress || 'GUNA (M.P)';
                const companyContact = data.companyContact || '7067842611';

                doc.font('Helvetica-Bold').fontSize(22).text(companyName.toUpperCase(), { align: 'center' });
                doc.font('Helvetica').fontSize(14).text(companyAddress, { align: 'center' });
                doc.moveDown(0.5);

                // Contact info on right
                doc.font('Helvetica').fontSize(11).text(`Contact: ${companyContact}`, {
                    align: 'right',
                });

                doc.moveDown(1.2);

                // Title
                doc.font('Helvetica-Bold').fontSize(18).text('BOOKING SLIP', { align: 'center' });
                doc.moveDown(1.5);

                // ───────────────────────────────
                // Content - better organization
                // ───────────────────────────────
                const labelX = 80;
                const valueX = 280;        // increased gap
                let y = doc.y;
                const rowHeight = 25;      // slightly more space

                const addRow = (label, value, isBold = false) => {
                    // Label (English) - use Helvetica
                    doc.font('Helvetica').fontSize(12).text(label, labelX, y);

                    // Value - can use Hindi font if needed
                    if (isBold) {
                        doc.font('Helvetica-Bold').fontSize(12).text(String(value || '-'), valueX, y);
                    } else {
                        doc.font('Helvetica').fontSize(12).text(String(value || '-'), valueX, y);
                    }
                    y += rowHeight;
                };

                // Booking Details Section
                addRow('Booking No:', data.BookingNo || data.slipNo || 'N/A', true);
                addRow('Date:', data.date || moment().format('DD MMM YYYY'));

                y += 5; // Small gap

                // Party Details
                doc.font('Helvetica-Bold').fontSize(14).text('Party Details:', 80, y);
                y += rowHeight;

                addRow('Party Name:', data.partyName || 'N/A');
                addRow('Party Mobile:', data.partyMobile || data.mobileNumber || 'N/A');

                y += 5; // Small gap

                // Transport Details
                doc.font('Helvetica-Bold').fontSize(14).text('Transport Details:', 80, y);
                y += rowHeight;

                addRow('Truck No:', data.truckNo || 'N/A');
                addRow('Driver Number:', data.driverNumber || 'N/A');

                y += 5; // Small gap

                // Location Details
                doc.font('Helvetica-Bold').fontSize(14).text('Location Details:', 80, y);
                y += rowHeight;

                addRow('From Location:', data.fromLocation || 'N/A');
                addRow('To Location:', data.toLocation || 'N/A');

                y += 5; // Small gap

                // Goods Details
                doc.font('Helvetica-Bold').fontSize(14).text('Goods Details:', 80, y);
                y += rowHeight;

                addRow('Commodity:', data.commodity || 'N/A');
                addRow('Approx Weight:', data.approxWeight || data.weight || 'N/A');

                y += 5; // Small gap

                // Booked By
                addRow('Booked By:', data.bookedBy || 'N/A');

                // Additional freight details if available
                if (data.partyRate || data.truckRate || data.differenceAmt) {
                    y += 10;
                    doc.font('Helvetica-Bold').fontSize(14).text('Freight Details:', 80, y);
                    y += rowHeight;

                    addRow('Party Rate:', data.partyRate ? `₹${data.partyRate}` : 'N/A');
                    addRow('Truck Rate:', data.truckRate ? `₹${data.truckRate}` : 'N/A');
                    addRow('Rate Difference:', data.rateDifference ? `₹${data.rateDifference}` : 'N/A');
                    addRow('Party Freight:', data.partyFreight ? `₹${data.partyFreight}` : 'N/A');
                    addRow('Truck Freight:', data.truckFreight ? `₹${data.truckFreight}` : 'N/A');
                    addRow('Difference Amount:', data.differenceAmt ? `₹${data.differenceAmt}` : 'N/A', true);

                    if (data.commissionAmt) {
                        addRow('Commission:', `₹${data.commissionAmt}`);
                    }

                    if (data.totalAmt) {
                        y += 5;
                        doc.font('Helvetica-Bold').fontSize(16).text('Total Amount:', 300, y);
                        doc.font('Helvetica-Bold').fontSize(18).text(`₹${data.totalAmt}`, 450, y);
                        y += 30;
                    }
                }

                // Separator line
                y += 20;
                doc.moveTo(60, y).lineTo(530, y).lineWidth(1).stroke();
                y += 30;

                // ───────────────────────────────
                // Hindi Notes - use Devanagari font
                // ───────────────────────────────
                doc.font('NotoDevanagari').fontSize(12);

                doc.text('नोट: शॉर्टेज जवाबदारी गाड़ी वाले की नहीं होगी।', 70, y);
                y += 22;
                doc.text('नोट: माल का बीमा कराना अनिवार्य है।', 70, y);
                y += 22;
                doc.text('नोट: माल का बीमा हमारे द्वारा ही कराया जायेगा।', 70, y);

                // Footer with signature
                y += 40;
                doc.moveTo(350, y).lineTo(500, y).lineWidth(1).stroke();
                doc.font('Helvetica').fontSize(11).text('Authorized Signature', 425, y + 5, { align: 'center' });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    // Apply similar changes to generateDifferenceSlip
    async generateDifferenceSlip(data) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                bufferPages: true,
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            try {
                doc.registerFont('NotoDevanagari', notoDevanagari);
                doc.font('NotoDevanagari');

                // Header (same as above)
                doc.font('Helvetica-Bold').fontSize(22).text('STC FREIGHT', { align: 'center' });
                doc.font('Helvetica').fontSize(14).text('GUNA (M.P)', { align: 'center' });
                doc.moveDown(0.5);
                doc.fontSize(11).text(`Contact No:-${data.mobileNumber || 'XXXXXXXXXX'}`, { align: 'right' });
                doc.moveDown(1.2);

                doc.font('Helvetica-Bold').fontSize(18).text('Difference Slip', { align: 'center' });
                doc.moveDown(1.5);

                const labelX = 80;
                const valueX = 260;
                let y = doc.y;
                const rowHeight = 24;

                const addRow = (label, value) => {
                    doc.font('Helvetica').fontSize(12).text(label, labelX, y);
                    doc.font('Helvetica-Bold').fontSize(12).text(String(value || '-'), valueX, y);
                    y += rowHeight;
                };

                addRow('Booking Slip No:', data.slipNo);
                addRow('Date:', data.date);
                addRow('Company Name:', data.companyName);
                addRow('Mobile Number:', data.mobileNumber);
                addRow('Truck No:', data.truckNo);
                addRow('From Location:', data.fromLocation);
                addRow('To Location:', data.toLocation);
                addRow('Commodity:', data.commodity);
                addRow('Weight:', data.weight);
                addRow('Weight type:', data.weightType);
                addRow('Booked Type:', data.bookedType || '-');
                addRow('Party Rate:', `₹${data.partyRate}`);
                addRow('Truck Rate:', data.truckRate);
                addRow('Rate Difference:', data.rateDifference);
                addRow('Commission Amt:', data.commissionAmt);
                addRow('Difference Amt:', `₹${data.differenceAmt}`);
                addRow('Total Amt:', `₹${data.totalAmt}`);
                addRow('Booked By:', data.bookedBy);

                y += 20;
                doc.moveTo(60, y).lineTo(530, y).stroke();
                y += 30;

                // Hindi notes
                doc.font('NotoDevanagari').fontSize(12);
                doc.text('नोट: जिम्मेदारी वाली गाड़ी वाले की नहीं होगी।', 70, y);
                y += 22;
                doc.text('नोट: माल का बीमा कराना अनिवार्य है।', 70, y);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    //     async generateBiltySlip(data) {
    //     return new Promise((resolve, reject) => {
    //         const doc = new PDFDocument({ 
    //             size: 'A4', 
    //             margin: 30,
    //             layout: 'portrait'
    //         });
    //         const buffers = [];

    //         doc.on('data', buffers.push.bind(buffers));
    //         doc.on('end', () => resolve(Buffer.concat(buffers)));

    //         try {
    //             // Set up fonts
    //             doc.registerFont('Helvetica', 'Helvetica');
    //             doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');

    //             // Set initial position
    //             let y = 30;

    //             // Header Section
    //             doc.font('Helvetica-Bold').fontSize(24)
    //                .text(data.companyName || 'STC FREIGHT', 0, y, { align: 'center' });
    //             y += 28;

    //             doc.font('Helvetica').fontSize(14)
    //                .text(data.companyAddress || 'GUNA (M.P)', 0, y, { align: 'center' });
    //             y += 20;

    //             if (data.companyPhone) {
    //                 doc.font('Helvetica').fontSize(12)
    //                    .text(`${data.companyPhone}`, 0, y, { align: 'center' });
    //                 y += 20;
    //             } else {
    //                 y += 5;
    //             }

    //             // Separator line
    //             doc.moveTo(30, y).lineTo(565, y).lineWidth(1).stroke();
    //             y += 15;

    //             // Bilty details in a table-like format
    //             const leftCol = 50;
    //             const rightCol = 200;
    //             const labelWidth = 120;
    //             const valueWidth = 150;

    //             // Function to add a detail row
    //             const addDetailRow = (label, value, yPos) => {
    //                 doc.font('Helvetica').fontSize(11)
    //                    .text(label, leftCol, yPos, { width: labelWidth });
    //                 doc.font('Helvetica-Bold').fontSize(11)
    //                    .text(String(value || '-'), rightCol, yPos, { width: valueWidth });
    //                 return yPos + 20;
    //             };

    //             y = addDetailRow('Bilty No.:', data.biltyNo, y);
    //             y = addDetailRow('Booking Slip No.:', data.bookingSlipNo, y);
    //             y = addDetailRow('From:', data.from, y);
    //             y = addDetailRow('To:', data.to, y);
    //             y = addDetailRow('Consigner:', data.consignor, y);
    //             y = addDetailRow('Consignee:', data.consignee, y);
    //             y = addDetailRow('Delivery Address:', data.deliveryAddress, y);

    //             y += 10;

    //             // Main table header
    //             const tableStartY = y;
    //             const col1 = 50;  // No. of Articles
    //             const col2 = 100; // Particulars
    //             const col3 = 200; // Weight Type
    //             const col4 = 260; // Weight
    //             const col5 = 320; // Rate
    //             const col6 = 380; // Total Freight
    //             const col7 = 470; // Remark

    //             // Table header
    //             doc.font('Helvetica-Bold').fontSize(10);
    //             doc.text('No. of Articles', col1, y);
    //             doc.text('Particulars', col2, y);
    //             doc.text('Weight Type', col3, y);
    //             doc.text('Weight', col4, y, { width: 50, align: 'right' });
    //             doc.text('Rate', col5, y, { width: 50, align: 'right' });
    //             doc.text('Total Freight', col6, y, { width: 80, align: 'right' });
    //             doc.text('Remark', col7, y);

    //             y += 20;

    //             // Draw table lines
    //             doc.moveTo(col1, tableStartY + 15).lineTo(col7 + 50, tableStartY + 15).stroke();
    //             doc.moveTo(col1, y).lineTo(col7 + 50, y).stroke();

    //             // Vertical lines
    //             doc.moveTo(col1, tableStartY).lineTo(col1, y).stroke();
    //             doc.moveTo(col2, tableStartY).lineTo(col2, y).stroke();
    //             doc.moveTo(col3, tableStartY).lineTo(col3, y).stroke();
    //             doc.moveTo(col4, tableStartY).lineTo(col4, y).stroke();
    //             doc.moveTo(col5, tableStartY).lineTo(col5, y).stroke();
    //             doc.moveTo(col6, tableStartY).lineTo(col6, y).stroke();
    //             doc.moveTo(col7, tableStartY).lineTo(col7, y).stroke();
    //             doc.moveTo(col7 + 50, tableStartY).lineTo(col7 + 50, y).stroke();

    //             // Table data row
    //             doc.font('Helvetica').fontSize(10);
    //             y += 5;
    //             doc.text('', col1, y); // Empty for No. of Articles
    //             doc.text(data.commodity || '', col2, y, { width: 90 });
    //             doc.text(data.weightType || '', col3, y, { width: 50 });
    //             doc.text(String(data.weight || ''), col4, y, { width: 50, align: 'right' });
    //             doc.text(String(data.rate || ''), col5, y, { width: 50, align: 'right' });
    //             doc.text(String(data.totalFreight?.toFixed(2) || ''), col6, y, { width: 80, align: 'right' });
    //             doc.text('', col7, y, { width: 50 }); // Empty for Remark

    //             y += 25;

    //             // Advance and Balance section
    //             const advanceY = y;

    //             // Advance Mode
    //             doc.font('Helvetica').fontSize(10)
    //                .text('Advance Mode', col1, y);
    //             doc.font('Helvetica-Bold').fontSize(10)
    //                .text(data.advanceMode || 'cash', col2, y);

    //             // Received
    //             doc.font('Helvetica').fontSize(10)
    //                .text('Received', col3, y);

    //             // Advance
    //             doc.font('Helvetica').fontSize(10)
    //                .text('Advance', col5, y);
    //             doc.font('Helvetica-Bold').fontSize(10)
    //                .text(String(data.advanceReceived?.toFixed(2) || '0'), col6, y, { width: 80, align: 'right' });

    //             y += 20;

    //             // Deduction (empty for now)
    //             doc.font('Helvetica').fontSize(10)
    //                .text('Deduction', col1, y);

    //             y += 20;

    //             // Balance
    //             doc.font('Helvetica-Bold').fontSize(10)
    //                .text('balance', col1, y);
    //             doc.font('Helvetica-Bold').fontSize(10)
    //                .text(String(data.balance?.toFixed(2) || '0'), col6, y, { width: 80, align: 'right' });

    //             // Draw lines for advance section
    //             doc.moveTo(col1, advanceY + 15).lineTo(col7 + 50, advanceY + 15).stroke();
    //             doc.moveTo(col1, advanceY + 35).lineTo(col7 + 50, advanceY + 35).stroke();
    //             doc.moveTo(col1, advanceY + 55).lineTo(col7 + 50, advanceY + 55).stroke();

    //             y += 30;

    //             // Additional information
    //             const bottomY = y;
    //             doc.font('Helvetica').fontSize(10)
    //                .text('Invoice No.:', 50, y);
    //             y += 15;

    //             doc.font('Helvetica').fontSize(10)
    //                .text('Goods Value:', 50, y);
    //             doc.font('Helvetica-Bold').fontSize(10)
    //                .text(`Party Phone: ${data.partyPhone || ''}`, 300, y);
    //             y += 20;

    //             // Company PAN details
    //             doc.font('Helvetica-Bold').fontSize(12)
    //                .text(data.companyName || 'ADMIN COMPANY', 0, y, { align: 'center' });
    //             y += 15;

    //             doc.font('Helvetica').fontSize(10)
    //                .text(`Excise Pan No: ${data.excisePanNo || 'ABCD123EF'}`, 150, y);
    //             doc.font('Helvetica').fontSize(10)
    //                .text(`TDS Pan No: ${data.tdsPanNo || 'ABCD123EF'}`, 350, y);
    //             y += 20;

    //             // Authorized signature
    //             doc.moveTo(400, y).lineTo(500, y).stroke();
    //             y += 5;
    //             doc.font('Helvetica-Bold').fontSize(11)
    //                .text('Authorized Signatory', 400, y, { width: 100, align: 'center' });

    //             doc.end();
    //         } catch (err) {
    //             reject(err);
    //         }
    //     });
    // }


    async generateBiltySlip(data) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: "A4", margin: 20 });

            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));

            try {
                const pageLeft = 20;
                const pageRight = 575;
                let y = 25;

                const money = (v) => (parseFloat(v || 0)).toFixed(2);

                /* ===================== OUTER BORDER ===================== */
                doc.rect(15, 15, 565, 810).stroke();

                /* ===================== HEADER ===================== */
                doc.font("Helvetica-Bold").fontSize(18)
                    .text(data.companyName || "STC FREIGHT", { align: "center" });

                y += 22;
                doc.fontSize(11).text(data.companyAddress || "GUNA (M.P)", { align: "center" });

                // y += 16;
                // doc.fontSize(11).text(data.companySubName || "TESTING COMPANY 1", { align: "center" });

                y += 25;

                doc.font("Helvetica").fontSize(10)
                    .text(`Company Contact - ${data.companyPhone || ""}`, pageLeft + 10, y);

                y += 25;

                /* ===================== LEFT RIGHT INFO ===================== */
                const leftX = pageLeft + 10;
                const rightX = 350;

                const rowLR = (l, r) => {
                    doc.text(l, leftX, y);
                    doc.text(r, rightX, y);
                    y += 16;
                };

                rowLR(`Bilty No.: ${data.biltyNo}`, `Bilty Date: ${data.biltyDate}`);
                rowLR(`Booking Slip No.: ${data.bookingId}`, `Booking Slip Date: ${data.bookingDate}`);
                rowLR(`From: ${data.from}`, `To: ${data.to}`);
                rowLR(`Consigner: ${data.consignor}`, `GST No: ${data.partyGST || ""}`);
                rowLR(`Consignee: ${data.consignee}`, `GST No: ${data.receiverGST || ""}`);
                rowLR(`Delivery Address: ${data.deliveryAddress}`, `Truck No: ${data.truckNo}`);

                y += 10;

                /* ===================== TABLE ===================== */
                /* ===================== TABLE ===================== */
                const startX = 20;
                const rowH = 26;

                // ✅ PERFECTLY ALIGNED COLUMNS (TOTAL = 540)
                const col = {
                    a: startX,           // No of Articles (70)
                    b: startX + 70,      // Particulars (130)
                    c: startX + 200,     // Weight Type (80)
                    d: startX + 280,     // Weight (60)
                    e: startX + 340,     // Rate (60)
                    f: startX + 400,     // Total Freight (80)
                    g: startX + 480,     // Remark (80)
                    end: startX + 560
                };

                const cell = (x, y, w, h = rowH) => doc.rect(x, y, w, h).stroke();

                /* ---------- HEADER ---------- */
                doc.font("Helvetica-Bold").fontSize(9);

                cell(col.a, y, 70);
                cell(col.b, y, 130);
                cell(col.c, y, 80);
                cell(col.d, y, 60);
                cell(col.e, y, 60);
                cell(col.f, y, 80);
                cell(col.g, y, 80);

                doc.text("No. of Articles", col.a + 5, y + 8);
                doc.text("Particulars", col.b + 5, y + 8);
                doc.text("Weight Type", col.c + 5, y + 8);
                doc.text("Weight", col.d + 5, y + 8);
                doc.text("Rate", col.e + 5, y + 8);
                doc.text("Total Freight", col.f + 5, y + 8);
                doc.text("Remark", col.g + 5, y + 8);

                y += rowH;

                /* ---------- DATA ROW ---------- */
                doc.font("Helvetica").fontSize(9);

                cell(col.a, y, 70);
                cell(col.b, y, 130);
                cell(col.c, y, 80);
                cell(col.d, y, 60);
                cell(col.e, y, 60);
                cell(col.f, y, 80);
                cell(col.g, y, 80);

                doc.text(data.noOfArticles || "", col.a + 5, y + 8);
                doc.text(data.particular || "", col.b + 5, y + 8);
                doc.text(data.weightType || "", col.c + 5, y + 8);
                doc.text(data.weight || "", col.d + 5, y + 8);
                doc.text(data.rate || "", col.e + 5, y + 8);
                doc.text(money(data.totalFreight), col.f + 5, y + 8);
                doc.text(data.remarks || "", col.g + 5, y + 8);

                y += rowH;

                /* ---------- ADVANCE ---------- */
                cell(col.a, y, 200);          // merged
                cell(col.c, y, 140);
                cell(col.f, y, 160);

                doc.text("Advance Mode", col.a + 5, y + 8);
                doc.text("Received", col.c + 5, y + 8);
                doc.text(`Advance : ${money(data.advance)}`, col.f + 5, y + 8);

                y += rowH;

                /* ---------- DEDUCTION ---------- */
                cell(col.a, y, 340);
                cell(col.f, y, 160);

                doc.text("Deduction", col.a + 5, y + 8);

                y += rowH;

                /* ---------- BALANCE ---------- */
                cell(col.a, y, 340);
                cell(col.f, y, 160);

                doc.text("Balance", col.a + 5, y + 8);
                doc.text(money(data.balance), col.f + 5, y + 8);

                y += rowH + 10;


                /* ===================== FOOTER ===================== */
                doc.fontSize(10);
                doc.text(`Invoice No: ${data.invoiceNo || ""}`, leftX, y);
                doc.text(`Goods Value: ${money(data.goodsValue)}`, 250, y);
                doc.text(`Party Phone: ${data.partyPhone || ""}`, rightX, y);

                y += 20;

                // doc.text("ADMIN COMPANY", leftX, y);
                // doc.text("For: STC FREIGHT", rightX, y);

                y += 20;

                doc.text("Excise Pan No: ABCD123EF", leftX, y);
                doc.text("Authorized Signatory", rightX, y);

                y += 15;
                doc.text("TDS Pan No: ABCD123EF", leftX, y);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }




}

module.exports = new PdfService();