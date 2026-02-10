const db = require('../config/database');
const pdfService = require('../services/pdfService');
const moment = require('moment');

class BookingPdfController {
    // Generate Difference Slip
    async generateDifferenceSlip(req, res) {
        try {
            const booking = await db.models.Booking.findByPk(req.params.id, {
                include: [
                    { model: db.models.Company, as: 'company', attributes: ['companyName', 'companyAddress', 'phoneNumber', 'companyEmail', 'gstNo', 'panNo'] },
                    { model: db.models.Party, as: 'party', attributes: ['partyName', 'partyPhone', 'partyAddress'] },
                    { model: db.models.Truck, as: 'truck', attributes: ['truckNo', 'driverName', 'driverPhone'] },
                    { model: db.models.User, as: 'updatedByUser', attributes: ['fullName'] },
                    { model: db.models.Commission, as: 'commissions', attributes: ['amount'] },
                ],
            });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            console.log(booking);
            const company = booking.company || {};
            const party = booking.party || {};
            const truck = booking.truck || {};
            const user = booking.updatedByUser || {};

            const partyRate = parseFloat(booking.rate) || 0;
            const truckRate = booking.weight && booking.truckFreight
                ? parseFloat(booking.truckFreight) / parseFloat(booking.weight)
                : 0;
            const rateDifference = partyRate - truckRate;

            const partyFreight = parseFloat(booking.partyFreight) || 0;
            const truckFreight = parseFloat(booking.truckFreight) || 0;
            const differenceAmount = partyFreight - truckFreight;

            const totalCommission = booking.commissions?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;

            const pdfData = {
                slipNo: booking.id,
                date: moment(booking.date).format('DD MMM YYYY') || moment().format('DD MMM YYYY'),
                companyName: company.companyName || 'STC FREIGHT',
                mobileNumber: party.partyPhone || '',
                truckNo: truck.truckNo || '',
                fromLocation: booking.fromLocation || '',
                toLocation: booking.toLocation || '',
                commodity: booking.commodity || '',
                weight: booking.weight || '0',
                weightType: booking.weightType || 'ton',
                bookedType: booking.bookedType || 'Bank', // adjust if you have this field
                partyRate: partyRate.toFixed(0),
                truckRate: truckRate.toFixed(0),
                rateDifference: rateDifference.toFixed(0),
                commissionAmt: totalCommission.toFixed(0),
                differenceAmt: differenceAmount.toFixed(0),
                totalAmt: differenceAmount.toFixed(0), // usually same as difference
                bookedBy: user.fullName || 'client',
            };

            const pdfBuffer = await pdfService.generateDifferenceSlip(pdfData);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="difference-slip-${booking.id}.pdf"`,
            });

            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating difference slip:', error);
            res.status(500).json({ message: 'Failed to generate PDF' });
        }
    }

    // Generate Booking Slip
    async generateBookingSlip(req, res) {
        try {
            const booking = await db.models.Booking.findByPk(req.params.id, {
                include: [
                    { model: db.models.Company, as: 'company', attributes: ['companyName', 'companyAddress', 'phoneNumber'] },
                    { model: db.models.Party, as: 'party', attributes: ['partyName', 'partyPhone'] },
                    { model: db.models.Truck, as: 'truck', attributes: ['truckNo', 'driverPhone'] },
                    { model: db.models.User, as: 'updatedByUser', attributes: ['fullName'] },
                ],
            });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            console.log(booking);

            const pdfData = {
                BookingNo: booking.id,
                companyName: booking.company?.companyName || 'STC FREIGHT',
                companyContact: booking.company?.phoneNumber || '',
                companyAddress: booking.company?.companyAddress || '',
                date: moment(booking.date).format('DD MMM YYYY') || moment().format('DD MMM YYYY'),
                partyName: booking.party?.partyName || '',
                truckNo: booking.truck?.truckNo || '',
                fromLocation: booking.fromLocation || '',
                toLocation: booking.toLocation || '',
                partyMobile: booking.party?.partyPhone || '',
                driverNumber: booking.truck?.driverPhone || '',
                commodity: booking.commodity || '',
                approxWeight: `${booking.weight || '0'} ${booking.weightType || 'ton'}`,
                bookedBy: booking.updatedByUser?.fullName || 'client',
                mobileNumber: booking.party?.partyPhone || '', // for header
            };
            console.log(pdfData);

            const pdfBuffer = await pdfService.generateBookingSlip(pdfData);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="booking-slip-${booking.id}.pdf"`,
            });

            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating booking slip:', error);
            res.status(500).json({ message: 'Failed to generate PDF' });
        }
    }

    // Generate Bilty Slip (simplified version)
    async generateBiltySlip(req, res) {
        try {
            const booking = await db.models.Booking.findByPk(req.params.id, {
                include: [
                    {
                        model: db.models.Company,
                        as: 'company',
                        attributes: ['companyName', 'companyAddress', 'phoneNumber']
                    },
                    {
                        model: db.models.Party,
                        as: 'party',
                        attributes: ['partyName', 'partyPhone', 'partyAddress']
                    },
                    {
                        model: db.models.Truck,
                        as: 'truck',
                        attributes: ['truckNo', 'driverName', 'driverPhone']
                    },
                    {
                        model: db.models.User,
                        as: 'updatedByUser',
                        attributes: ['fullName']
                    },
                ],
            });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            console.log("i am from testing ", booking.id)
            // Get party payments to calculate advance
            const partyPayments = await db.models.PartyPayments.findAll({
                where: { bookingId: booking.id },
                attributes: ['amount', 'paymentMode', 'paymentDate']
            });

            // Calculate total advance received
            const totalAdvance = partyPayments.reduce((sum, payment) =>
                sum + parseFloat(payment.amount || 0), 0);

            const partyFreight = parseFloat(booking.partyFreight) || 0;
            const balance = partyFreight - totalAdvance;

            const pdfData = {
                biltyNo: booking.id,
                bookingSlipNo: booking.id, // You might want to add a booking slip number field
                date: moment(booking.date).format('DD MMM YYYY'),
                from: booking.fromLocation || '',
                to: booking.toLocation || '',
                consignor: booking.company?.companyName || '',
                consignee: booking.party?.partyName || '',
                deliveryAddress: booking.party?.partyAddress || '',
                commodity: booking.commodity || '',
                weightType: booking.weightType || 'ton',
                weight: booking.weight || 0,
                rate: booking.rate || 0,
                totalFreight: partyFreight,
                advanceMode: partyPayments.length > 0 ?
                    partyPayments[0].paymentMode || 'cash' : 'cash',
                advanceReceived: totalAdvance,
                balance: balance,
                companyName: booking.company?.companyName || 'STC FREIGHT',
                companyAddress: booking.company?.companyAddress || 'GUNA (M.P)',
                companyPhone: booking.company?.phoneNumber || '',
                excisePanNo: 'ABCD123EF', // You should store this in company table
                tdsPanNo: 'ABCD123EF', // You should store this in company table
                bookedBy: booking.updatedByUser?.fullName || 'Authorized Signatory',
                partyPhone: booking.party?.partyPhone || '',
            };

            const pdfBuffer = await pdfService.generateBiltySlip(pdfData);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="bilty-slip-${booking.id}.pdf"`,
            });

            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating bilty slip:', error);
            res.status(500).json({ message: 'Failed to generate PDF' });
        }
    }

    async getBiltyByBookingId(req, res) {
        console.log("i am from testing ", req.params);

        try {
            const { bookingId } = req.params;

            /* ===================== 1️⃣ GET BILTY ===================== */
            const bilty = await db.models.Bilty.findOne({
                where: { bookingId },
                include: [
                    {
                        model: db.models.Party,
                        as: "party",
                        attributes: ["partyName", "partyPhone", "partyAddress"],
                    },
                ],
            });

            if (!bilty) {
                return res.status(404).json({
                    success: false,
                    message: "Bilty not found for this booking",
                });
            }

            /* ===================== 2️⃣ GET BOOKING (FOR companyId) ===================== */
            const booking = await db.models.Booking.findByPk(bookingId, {
                attributes: ["id", "companyId", "date"],
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                });
            }

            /* ===================== 3️⃣ GET COMPANY ===================== */
            const company = await db.models.Company.findByPk(booking.companyId, {
                attributes: ["companyName", "companyAddress", "phoneNumber"],
            });

            /* ===================== 4️⃣ PREPARE PDF DATA ===================== */
            const pdfData = {
                biltyNo: bilty.id,
                bookingId: bilty.bookingId,
                biltyDate: moment(bilty.biltyDate).format('DD MMM YYYY'),
                bookingDate: moment(booking.date).format('DD MMM YYYY'),

                from: bilty.fromLocation,
                to: bilty.toLocation,

                consignor: company?.companyName || "",
                companyAddress: company?.companyAddress || "",
                companyPhone: company?.phoneNumber || "",

                consignee: bilty.party?.partyName || "",
                partyPhone: bilty.party?.partyPhone || "",
                deliveryAddress: bilty.deliveryAddress || "",

                truckNo: bilty.truckNo,
                weight: bilty.weight,
                weightType: bilty.weightType,
                rate: bilty.rate,
                totalFreight: bilty.totalFreightAmt,

                advance: bilty.advanced || 0,
                received: bilty.received || 0,
                balance: bilty.balance || 0,

                remarks: bilty.remarks,
            };

            /* ===================== 5️⃣ GENERATE PDF ===================== */
            const pdfBuffer = await pdfService.generateBiltySlip(pdfData);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=bilty-${bilty.id}.pdf`
            );

            res.send(pdfBuffer);

        } catch (error) {
            console.error("Error generating bilty slip:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate PDF",
            });
        }
    }


}

module.exports = new BookingPdfController();