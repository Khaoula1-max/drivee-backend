// emailService.js
const nodemailer = require('nodemailer');

// Configurer le transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Fonction pour envoyer un email d'approbation (inchangée)
async function sendApprovalEmail(userEmail, schoolName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Votre école a été vérifiée - Drivee',
      html: `
        <div style="font-family: Arial, sans-serif; color: #001F3F; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #001F3F; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Drivee</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #001F3F;">Félicitations !</h2>
            <p>Votre école <strong>${schoolName}</strong> a été vérifiée avec succès.</p>
            <p>Vous pouvez maintenant profiter de toutes les fonctionnalités réservées aux écoles sur notre plateforme.</p>
            <p style="margin-top: 30px;">Cordialement,</p>
            <p><strong>L'équipe Drive</strong></p>
          </div>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Drivee. Tous droits réservés.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email d'approbation envoyé à ${userEmail}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email d'approbation:", error);
    throw error;
  }
}

// Fonction pour envoyer un email de rejet (modifiée avec style rouge)
async function sendRejectionEmail(userEmail, schoolName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Demande de vérification rejetée - Drivee',
      html: `
        <div style="font-family: Arial, sans-serif; color: #001F3F; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #001F3F; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Drivee</h1>
          </div>
          <div style="padding: 20px;">
            <!-- Alerte de danger en rouge -->
            <div style="background-color: #FFEBEE; border-left: 4px solid #F44336; padding: 12px; margin-bottom: 20px;">
              <div style="display: flex; align-items: center;">
                <svg style="width: 24px; height: 24px; margin-right: 10px; color: #F44336;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <h3 style="color: #D32F2F; margin: 0;">Demande rejetée</h3>
              </div>
            </div>
            
            <h2 style="color: #D32F2F;">Notification de rejet</h2>
            <p>Votre demande de vérification pour l'école <strong style="color: #D32F2F;">${schoolName}</strong> a été rejetée.</p>
            
            <div style="background-color: #FFF3E0; border-left: 4px solid #FFA000; padding: 12px; margin: 20px 0;">
              <p style="margin: 0; color: #E65100;">
                <strong>Note :</strong> Vous pouvez soumettre une nouvelle demande avec des documents valides si vous souhaitez être vérifié.
              </p>
            </div>
            
            <p style="margin-top: 30px;">Cordialement,</p>
            <p><strong>L'équipe Drive</strong></p>
          </div>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Drivee. Tous droits réservés.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de rejet envoyé à ${userEmail}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rejet:", error);
    throw error;
  }
}

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail
};