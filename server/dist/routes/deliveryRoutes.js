"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deliveryController_1 = require("../controllers/deliveryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Delivery partner endpoints protected by role check
router.use(auth_1.authenticate);
router.use((0, auth_1.requireRole)(['DELIVERY_PARTNER', 'ADMIN']));
router.get('/assignments', deliveryController_1.getPartnerAssignments);
router.post('/assignments/:id/accept', deliveryController_1.acceptAssignment);
router.post('/assignments/:id/pickup', deliveryController_1.pickupOrder);
router.post('/assignments/:id/start', deliveryController_1.startDelivery);
router.post('/assignments/:id/location', deliveryController_1.updateLocationRest);
router.post('/assignments/:id/complete', deliveryController_1.completeDelivery);
// Compatibility aliases for frontend dashboard actions
router.post('/orders/:id/pickup', deliveryController_1.pickupOrder);
router.post('/orders/:id/start', deliveryController_1.startDelivery);
router.post('/orders/:id/complete', deliveryController_1.completeDelivery);
router.post('/orders/:id/verify-otp', deliveryController_1.completeDelivery);
router.patch('/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    if (status === 'PICKED_UP') {
        return (0, deliveryController_1.pickupOrder)(req, res);
    }
    if (status === 'OUT_FOR_DELIVERY') {
        return (0, deliveryController_1.startDelivery)(req, res);
    }
    if (status === 'DELIVERED') {
        return (0, deliveryController_1.completeDelivery)(req, res);
    }
    return res.status(400).json({ message: `Unsupported status: ${status}` });
});
exports.default = router;
