const Media = require('../models/Media')
const Message = require('../models/Message')


// Send Message API with files
 sendMessage = async (req, res) => {
  const { message, groupId, messageType } = req.body;
  const files = req.files; // Extract files from the request
  // const senderId = req.user.userId; // Extract senderId from auth middleware
  const senderId=1;
  try {
    const { io } = req;

    // Save the message data
    const messageData = {
      senderId,
      message: message || null,
      groupId,
      isRead: false,
      messageType,
    };

    console.log("Message Data:", messageData);

    // Save the message to the database
    const newMessage = await Message.create(messageData);

    let mediaDetails = [];
    if (files && files.length > 0) {
      console.log("Processing Files:", files);
      mediaDetails = await Media.bulkCreate(
        files.map((file) => ({
          messageId: newMessage.id,
          mediaDetails: `public/uploads/${file.filename}`,
          title: "image",
        })),
        { returning: true }
      );
      console.log("Media Details Saved:", mediaDetails);
    }

    // Prepare media URLs for response
    const mediaUrls = mediaDetails.map(
      (media) => `${BASEURL}${media.mediaDetails}`
    );

    // Prepare response
    const messageResponse = {
      id: newMessage.id,
      senderId: newMessage.senderId,
      isRead: newMessage.isRead,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
      message: newMessage.message,
      media: mediaUrls,
      messageType,
    };

    // Emit the message to the group
    console.log(`Emitting message to group ${groupId}`);
    io.to(groupId).emit("receive_message", messageResponse);

    return res.status(200).json({
      message: "Message sent successfully.",
      data: messageResponse,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: error.message });
  }
};


module.exports=sendMessage