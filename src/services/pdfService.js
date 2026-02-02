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
                // Header
                // ───────────────────────────────
                doc.font('Helvetica-Bold').fontSize(22).text('STC FREIGHT', { align: 'center' });
                doc.font('Helvetica').fontSize(14).text('GUNA (M.P)', { align: 'center' });
                doc.moveDown(0.5);

                doc.fontSize(11).text(`Siddharth-${data.mobileNumber || 'XXXXXXXXXX'}`, {
                    align: 'right',
                });

                doc.moveDown(1.2);

                // Title
                doc.font('Helvetica-Bold').fontSize(18).text('Booking Slip', { align: 'center' });
                doc.moveDown(1.5);

                // ───────────────────────────────
                // Content - wider separation, better alignment
                // ───────────────────────────────
                const labelX = 80;
                const valueX = 260;        // increased gap
                let y = doc.y;
                const rowHeight = 24;      // slightly more space

                const addRow = (label, value) => {
                    // Label (English) - use Helvetica
                    doc.font('Helvetica').fontSize(12).text(label, labelX, y);

                    // Value - can use Hindi font if needed
                    doc.font('Helvetica-Bold').fontSize(12).text(String(value || '-'), valueX, y);
                    y += rowHeight;
                };

                addRow('Booking Slip No:', data.slipNo);
                addRow('Company Name:', data.companyName);
                addRow('From Location:', data.fromLocation);
                addRow('To Location:', data.toLocation);
                addRow('Party Mobile Number:', data.partyMobile);
                addRow('Truck Driver Number:', data.driverNumber);
                addRow('Commodity:', data.commodity);
                addRow('Approx Weight:', data.approxWeight);
                addRow('Booked By:', data.bookedBy);

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
                doc.fontSize(11).text(`Siddharth-${data.mobileNumber || 'XXXXXXXXXX'}`, { align: 'right' });
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

    async generateBiltySlip(data) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            try {
                doc.registerFont('NotoDevanagari', notoDevanagari);
                doc.font('NotoDevanagari');
                // Header
                doc.font('Helvetica-Bold').fontSize(22).text('STC FREIGHT', { align: 'center' });
                doc.font('Helvetica').fontSize(14).text('GUNA (M.P)', { align: 'center' });
                doc.moveDown(1.5);

                // Title
                doc.font('Helvetica-Bold').fontSize(18).text('BILTY SLIP / LR COPY', { align: 'center' });
                doc.moveDown(1.2);

                // Content
                const left = 70;
                const right = 240;
                let y = doc.y;
                const rowHeight = 22;

                const row = (label, value) => {
                    doc.font('Helvetica').fontSize(11).text(label, left, y);
                    doc.font('Helvetica-Bold').fontSize(11).text(String(value || '-'), right, y);
                    y += rowHeight;
                };

                row('Bilty No:', data.biltyNo);
                row('Date:', data.date);
                row('Consignor:', data.consignor.name);
                row('Consignee:', data.consignee.name);
                row('From:', data.consignor.address || data.from || '-');
                row('To:', data.consignee.address || data.to || '-');
                row('Vehicle No:', data.vehicleNo);
                row('Driver:', data.driverName);
                row('Commodity:', data.commodity);
                row('Weight:', `${data.actualWeight} ${data.weightType}`);
                row('Freight Amount:', `₹${data.freightAmount?.toLocaleString('en-IN') || '0'}`);
                row('Advance Paid:', `₹${data.advancePaid?.toLocaleString('en-IN') || '0'}`);
                row('Balance Freight:', `₹${data.balanceFreight?.toLocaleString('en-IN') || '0'}`);
                row('Booked By:', data.bookedBy);

                // Separator
                y += 15;
                doc.moveTo(50, y).lineTo(550, y).stroke();
                y += 25;

                // Notes
                doc.font('NotoDevanagari').fontSize(11).text('नोट: शॉर्टेज जबाबदारी गाड़ी वाले की नहीं होगी।', 50, y);
                y += 18;
                doc.text('नोट: माल का बीमा कराना अनिवार्य है।', 50, y);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = new PdfService();