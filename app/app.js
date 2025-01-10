const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const twilio = require("twilio");
const path = require("path");

dotenv.config();
const app = express();
const port = 3000;


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);


app.use(bodyParser.json());
app.use(express.static("public")); // For static assets (CSS, JS, etc.)


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.post("/api/send-sms", async (req, res) => {
  try {
    const { senderName, to, message } = req.body;

    if (!senderName || !to || message === undefined) {
      return res.status(400).json({
        success: false,
        message: "Sender name, recipient, and message are required.",
      });
    }


    await client.messages.create({
      to, // Recipient's phone number
      from: twilioPhoneNumber, // Your Twilio phone number
      body: `${senderName} says: ${message || "No message"}`, // The message to send
    });

    res.json({ success: true, message: "SMS sent successfully!" });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: `Error sending SMS: ${err.message}`,
    });
  }
});


app.get("/api/list-messages", async (req, res) => {
  try {
    const messages = await client.messages.list({ limit: 20 });

    res.json({
      messages: messages.map((msg) => ({
        sid: msg.sid,
        sender: msg.from,
        to: msg.to,
        body: msg.body,
      })),
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: `Error fetching messages: ${err.message}`,
    });
  }
});


app.patch("/api/update-message/:sid", async (req, res) => {
  const { sid } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: "Message content is required for update.",
    });
  }

  try {
    const updatedMessage = await client.messages(sid).update({ body: message });
    res.json({ success: true, message: "Message updated successfully!" });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: `Error updating message: ${err.message}`,
    });
  }
});


app.delete("/api/delete-message/:sid", async (req, res) => {
  const { sid } = req.params;

  try {
    await client.messages(sid).remove();
    res.json({ success: true, message: "Message deleted successfully!" });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: `Error deleting message: ${err.message}`,
    });
  }
});


app.listen(port, () => console.log(`App running on port ${port}`));
