const cron = require('node-cron');
const moment = require('moment');
const db = require('../config/database');
const { Op } = require('sequelize');

cron.schedule('0 10 * * *', async () => {

    console.log("Checking driver license expiry...");

    const next7Days = moment().add(7, 'days').endOf('day').toDate();

    const drivers = await db.models.Driver.findAll({
        where: {
            licenseExpiry: { [Op.lte]: next7Days }
        }
    });

    for (let d of drivers) {

        const exists = await db.models.VehicleNotification.findOne({
            where: {
                truckId: d.id,  // reuse
                docType: 'LICENSE',
                isResolved: false
            }
        });

        if (!exists) {
            await db.models.VehicleNotification.create({
                truckId: d.id,
                docType: 'LICENSE',
                expiryDate: d.licenseExpiry
            });

            console.log(`⚠ License expiring for Driver ${d.driverName}`);
        }
    }
});