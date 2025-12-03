const nodemailer = require("nodemailer");

// Create transporter (configure based on your email provider)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
});

// Send email notification
async function sendStatusUpdateEmail(userEmail, complaintTitle, status) {
  const statusMessages = {
    pending: "Pengaduan Anda telah diterima dan sedang menunggu review.",
    diproses: "Pengaduan Anda sedang dalam proses penanganan.",
    selesai: "Pengaduan Anda telah selesai ditangani.",
    ditolak: "Pengaduan Anda telah ditinjau dan tidak dapat diproses.",
  };

  const mailOptions = {
    from:
      process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER,
    to: userEmail,
    subject: `Update Status Pengaduan: ${complaintTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Update Status Pengaduan</h2>
        <p>Status pengaduan Anda telah diperbarui:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Judul:</strong> ${complaintTitle}</p>
          <p><strong>Status:</strong> <span style="color: #2563eb;">${status.toUpperCase()}</span></p>
        </div>
        <p>${statusMessages[status]}</p>
        <p>Terima kasih telah menggunakan layanan pengaduan warga.</p>
      </div>
    `,
  };

  try {
    const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    if (emailHost && emailUser) {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } else {
      console.log("Email service not configured. Skipping email notification.");
      return { success: false, reason: "not_configured" };
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

// Send welcome email
async function sendWelcomeEmail(userEmail, userName) {
  const mailOptions = {
    from:
      process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER,
    to: userEmail,
    subject: "Selamat Datang di Sistem Pengaduan Warga",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Selamat Datang, ${userName}!</h2>
        <p>Terima kasih telah mendaftar di Sistem Pengaduan Warga.</p>
        <p>Anda dapat mulai membuat pengaduan dan memantau statusnya secara real-time.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Mulai Membuat Pengaduan
          </a>
        </div>
        <p>Salam,<br>Tim Pengaduan Warga</p>
      </div>
    `,
  };

  try {
    const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    if (emailHost && emailUser) {
      await transporter.sendMail(mailOptions);
      return { success: true };
    }
    return { success: false, reason: "not_configured" };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendStatusUpdateEmail,
  sendWelcomeEmail,
};
