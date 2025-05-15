const myServices = require("./myServices");
const db = require("../config/database");
const { where } = require("sequelize");
const OTP_EXPIRATION_TIME = process.env.OTP_EXPIRATION_TIME || 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 4; // Max attempts before blocking
const BLOCK_TIME = 24 * 60 * 60 * 1000; // Block time duration (e.g., 24 hours)

const otpService = {
  // Method to verify OTP and handle attempts
  verifyOtp: async (model, email, otp) => {
    // Find the user by email
    const user = await myServices.checkExist(model, { email: email });

    if (!user.success) {
      return {
        success: false,
        message: "User not found.",
      };
    }
    
    // Check if the user is blocked and the block time has expired
    if (user.data.blocked_at && new Date() - new Date(user.data.blocked_at) < BLOCK_TIME) {
      const remainingBlockTime =
      BLOCK_TIME - (new Date() - new Date(user.data.blocked_at));
      const hours = Math.floor(remainingBlockTime / 3600000);
      const minutes = Math.floor((remainingBlockTime % 3600000) / 60000);
      const seconds = Math.floor((remainingBlockTime % 60000) / 1000);
    
      return {
        success: false,
        message: `Your account is temporarily blocked. Please try again after ${hours} hour(s), ${minutes} minute(s), and ${seconds} second(s).`,
      };
    }
    

    // Find the latest OTP for the user using email
    const userOtp = await db.models.UserOtp.findOne({
      where: { email }, // Find the OTP entry based on email
      order: [["createdAt", "DESC"]], // Ensure we get the latest OTP
    });

    if (!userOtp) {
      return {
        success: false,
        message: "No OTP found for this user.",
      };
    }

    // Check if OTP matches
    if (userOtp.otp !== otp) {
      // Increment the failed attempt count for the user
      const newOtpAttempts = user.data.otp_attempts + 1;

      // Update `otp_attempts` without blocking the user yet
      const update = await myServices.update(db.models.User, user.data.id, {
        otp_attempts: newOtpAttempts,
      });

      if (update.success !== true) {
        return {
          success: false,
          message: `Failed to update OTP attempts for User with ID ${user.data.id}.`,
        };
      }

      // If user reached max attempts, lock them out
      if (newOtpAttempts >= MAX_ATTEMPTS) {
        await myServices.update(db.models.User, user.data.id, {
          otp_attempts: newOtpAttempts,
          blocked_at: new Date(),
        });
        return {
          success: false,
          message:
            "Too many failed attempts. Your account has been temporarily blocked. Please try again later.",
        };
      }

      // Explicitly throw an error for invalid OTP
      return {
        success: false,
        message: "Invalid OTP.",
      };
    }

    // Check OTP expiration
    const isExpired = new Date() - new Date(userOtp.createdAt) > OTP_EXPIRATION_TIME;
    if (isExpired) {
      return {
        success: false,
        message: "The OTP has expired. Kindly request a new one to proceed",
      };
    }

    const update = await myServices.update(db.models.User, user.data.id, {
      otp_attempts: 0,
      blocked_at: null,
      is_verified: true,
    });

    return update;
  },

  // Method to check if OTP cooldown has passed
  checkOtpCooldown: async (email) => {

    const lastOtp = await db.models.UserOtp.findOne({
      where: { email },
      order: [['createdAt', 'DESC']],  // Get the latest OTP
    });

    // Check if the last OTP is within the expiration time
    if (lastOtp && new Date() - new Date(lastOtp.createdAt) < OTP_EXPIRATION_TIME) {
      const remainingTime =
        OTP_EXPIRATION_TIME - (new Date() - new Date(lastOtp.createdAt));
      const minutes = Math.floor(remainingTime / 60000); // Convert to minutes
      const seconds = ((remainingTime % 60000) / 1000).toFixed(0); // Convert to seconds

      return {
        status: false,
        message: `You recently requested an OTP. Please wait ${minutes} minute(s) and ${seconds} second(s) before trying again.`,
      };
    }

    return { status: true };
  },

  checkBlockStatus: async (user) => {
    if (user.blocked_at) {
      const timeElapsedSinceBlocked = new Date() - new Date(user.blocked_at);

      if (timeElapsedSinceBlocked < BLOCK_TIME) {
        // Calculate remaining block time
        const remainingBlockTime = BLOCK_TIME - timeElapsedSinceBlocked;
        const hours = Math.floor(remainingBlockTime / 3600000);
        const minutes = Math.floor((remainingBlockTime % 3600000) / 60000);
        const seconds = Math.floor((remainingBlockTime % 60000) / 1000);

        return {
          isBlocked: true,
          isVerified: user.is_verified,
          message: `Your account is temporarily blocked. Please try again after ${hours} hour(s), ${minutes} minute(s), and ${seconds} second(s).`,
        };
      } else {
        // Unblock user if block time has expired
        await user.update({ blocked_at: null, otp_attempts: 0 });
      }
    }

    return { isBlocked: false, message: null };
  },
};

module.exports = otpService;
