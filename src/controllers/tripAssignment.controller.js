const db = require('../config/database');
const myServices = require('../services/myServices');

// ASSIGN TRUCK + DRIVER
exports.assignTrip = async (req, res) => {

    const result = await myServices.create(db.models.TripAssignment, req.body);

    // change truck status
    if (result.success) {
        await myServices.updateByWhere(db.models.Truck,
            { id: req.body.vehicleId },
            { status: 'onTrip' }
        );
    }

    res.status(result.success ? 201 : 400).json(result);
};

// GET ASSIGNMENT
exports.getAssignments = async (req, res) => {
    const result = await myServices.list(db.models.TripAssignment);
    res.json(result);
};

// COMPLETE TRIP
// exports.completeTrip = async (req, res) => {

//     const assignment = await db.models.TripAssignment.findByPk(req.params.id);

//     if (!assignment) {
//         return res.json({ success: false, message: "Assignment not found" });
//     }

//     await myServices.updateByWhere(db.models.Truck,
//         { id: assignment.truckId },
//         { status: 'active' }
//     );

//     res.json({ success: true, message: "Trip Completed" });
// };

exports.completeTrip = async (req, res) => {

    const t = await db.sequelize.transaction();

    try {

        const assignment = await db.models.TripAssignment.findOne({
            where: {
                id: req.params.id,
                tripStatus: 'Assigned'
            },
            transaction: t
        });

        if (!assignment) {
            await t.rollback();
            return res.json({
                success: false,
                message: "Trip not found or already completed"
            });
        }

        // 1️⃣ Update Trip Status
        await assignment.update({
            tripStatus: 'Completed',
            completedAt: new Date()
        }, { transaction: t });

        // 2️⃣ Make Truck Active Again
        await db.models.Truck.update(
            { status: 'Active' },
            {
                where: { id: assignment.truckId },
                transaction: t
            }
        );

        await t.commit();

        return res.json({
            success: true,
            message: "Trip completed successfully"
        });

    } catch (error) {

        await t.rollback();

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};