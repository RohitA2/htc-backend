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
                    { model: db.models.Party, attributes: ['partyName', 'partyPhone', 'partyAddress'] },
                    { model: db.models.Truck, attributes: ['truckNo', 'driverName', 'driverPhone'] },
                    { model: db.models.User, as: 'updatedByUser', attributes: ['fullName'] },
                    { model: db.models.Commission, as: 'commissions', attributes: ['amount'] },
                ],
            });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            const company = booking.company || {};
            const party = booking.Party || {};
            const truck = booking.Truck || {};
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
                    { model: db.models.Party, attributes: ['partyName', 'partyPhone'] },
                    { model: db.models.Truck, attributes: ['truckNo', 'driverPhone'] },
                    { model: db.models.User, as: 'updatedByUser', attributes: ['fullName'] },
                ],
            });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            const pdfData = {
                slipNo: booking.id,
                companyName: booking.company?.companyName || 'STC FREIGHT',
                fromLocation: booking.fromLocation || '',
                toLocation: booking.toLocation || '',
                partyMobile: booking.Party?.partyPhone || '',
                driverNumber: booking.Truck?.driverPhone || '',
                commodity: booking.commodity || '',
                approxWeight: `${booking.weight || '0'} ${booking.weightType || 'ton'}`,
                bookedBy: booking.updatedByUser?.fullName || 'client',
                mobileNumber: booking.Party?.partyPhone || '', // for header
            };

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
                    { model: db.models.Company, as: 'company', attributes: ['companyName', 'companyAddress', 'phoneNumber'] },
                    { model: db.models.Party, attributes: ['partyName', 'partyPhone', 'partyAddress'] },
                    { model: db.models.Truck, attributes: ['truckNo', 'driverName', 'driverPhone'] },
                    { model: db.models.User, as: 'updatedByUser', attributes: ['fullName'] },
                ],
            });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            const partyFreight = parseFloat(booking.partyFreight) || 0;
            const advancePaid = parseFloat(booking.advancePaid) || 0;

            const pdfData = {
                biltyNo: booking.id,
                date: moment(booking.date).format('DD MMM YYYY'),
                consignor: {
                    name: booking.company?.companyName || 'STC FREIGHT',
                    address: booking.company?.companyAddress || '',
                    phone: booking.company?.companyPhone || '',
                },
                consignee: {
                    name: booking.Party?.partyName || '',
                    address: booking.Party?.partyAddress || '',
                    phone: booking.Party?.partyPhone || '',
                },
                vehicleNo: booking.Truck?.truckNo || '',
                driverName: booking.Truck?.driverName || '',
                commodity: booking.commodity || '',
                actualWeight: booking.weight || '0',
                weightType: booking.weightType || 'ton',
                freightAmount: partyFreight,
                advancePaid: advancePaid,
                balanceFreight: partyFreight - advancePaid,
                bookedBy: booking.updatedByUser?.fullName || 'Authorized Signatory',
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
}

module.exports = new BookingPdfController();