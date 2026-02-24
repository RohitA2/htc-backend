const cron = require('node-cron');
const moment = require('moment');
const db = require('../config/database');
const { Op } = require('sequelize');

cron.schedule('0 9 * * *', async () => {

    console.log("Checking truck document expiry...");

    const next7Days = moment().add(7, 'days').endOf('day').toDate();

    const trucks = await db.models.Truck.findAll({
        where: {
            [Op.or]: [
                { rcExpiry: { [Op.lte]: next7Days } },
                { insuranceExpiry: { [Op.lte]: next7Days } },
                { permitExpiry: { [Op.lte]: next7Days } },
                { fitnessExpiry: { [Op.lte]: next7Days } },
                { pucExpiry: { [Op.lte]: next7Days } }
            ]
        }
    });

    for (let t of trucks) {

        const docs = [
            { type: 'RC', date: t.rcExpiry },
            { type: 'INSURANCE', date: t.insuranceExpiry },
            { type: 'PERMIT', date: t.permitExpiry },
            { type: 'FITNESS', date: t.fitnessExpiry },
            { type: 'PUC', date: t.pucExpiry }
        ];

        for (let d of docs) {

            if (d.date && moment(d.date).isSameOrBefore(next7Days)) {

                const exists = await db.models.VehicleNotification.findOne({
                    where: {
                        truckId: t.id,
                        docType: d.type,
                        isResolved: false
                    }
                });

                if (!exists) {
                    await db.models.VehicleNotification.create({
                        truckId: t.id,
                        docType: d.type,
                        expiryDate: d.date
                    });

                    console.log(`⚠ ${d.type} expiring for Truck ${t.truckNo}`);
                }
            }
        }
    }
});