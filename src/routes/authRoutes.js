const express = require('express');
const authController = require('../controllers/authController'); // Assuming the controller is in the controllers folder
const authMiddlewareToken = require('../middleware/authMiddleware');
const authenticateClient  = require('../middleware/roleMiddleware');



const router = express.Router();
const clientRoutes = [authMiddlewareToken, authenticateClient];

// Routes
router.post('/register', authController.register); // Create a user
router.post('/verify-otp',authController.verifyOtp); // verify account
router.post('/resend-otp',authController.resendOtp);  // resend otp
router.post('/login',authController.login)
router.get('/profile',authMiddlewareToken,authController.getUserProfile)
router.post('/changePassword',authMiddlewareToken,authController.changePassword)
router.post('/updateProfile',authMiddlewareToken,authController.updateProfile)
router.post('/updateMoreDetails',authMiddlewareToken,authController.updateUser)
router.post('/createPassword',authController.password)
router.post('/moreDetails', authMiddlewareToken,authController.moreDetails)


module.exports = router;
