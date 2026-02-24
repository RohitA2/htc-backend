const cron = require('node-cron');
const moment = require('moment');
const db = require('../config/database');
const { Op } = require('sequelize');

cron.schedule('0 11 * * *', async () => {

    console.log("Checking TEMP driver license expiry...");

    const next7Days = moment().add(7, 'days').endOf('day').toDate();

    const tempDrivers = await db.models.TripAssignment.findAll({
        where: {
            driverId: null,
            licenseExpiry: { [Op.lte]: next7Days }
        }
    });

    for (let d of tempDrivers) {

        const exists = await db.models.VehicleNotification.findOne({
            where: {
                truckId: d.truckId,
                docType: 'TEMP_LICENSE',
                isResolved: false
            }
        });

        if (!exists) {
            await db.models.VehicleNotification.create({
                truckId: d.truckId,
                docType: 'TEMP_LICENSE',
                expiryDate: d.licenseExpiry
            });

            console.log(`⚠ Temp Driver License expiring: ${d.driverName}`);
        }
    }
});