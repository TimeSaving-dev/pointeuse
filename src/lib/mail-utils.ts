/**
 * Utilitaire pour l'envoi d'e-mails
 * 
 * Cette implémentation est une simulation pour le développement.
 * En production, il faudrait remplacer par un service d'envoi d'e-mails 
 * comme SendGrid, Mailgun, ou un serveur SMTP standard.
 */

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Envoie un e-mail
 * 
 * En mode développement, l'e-mail est simplement loggé dans la console.
 * En production, cette fonction devrait être remplacée par un véritable service d'e-mail.
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  // En mode développement, on simule l'envoi d'e-mail
  if (process.env.NODE_ENV === 'development') {
    console.log('====================================');
    console.log('📧 SIMULATION D\'ENVOI D\'E-MAIL:');
    console.log('------------------------------------');
    console.log(`À: ${to}`);
    console.log(`Sujet: ${subject}`);
    if (text) console.log(`Texte: ${text}`);
    if (html) console.log(`HTML: ${html}`);
    console.log('====================================');
    
    return true;
  }
  
  // En production, on pourrait utiliser un service comme SendGrid
  try {
    // Exemple d'implémentation avec SendGrid (à décommenter et configurer en production)
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'contact@votredomaine.com',
      subject,
      text,
      html,
    };
    
    await sgMail.send(msg);
    */
    
    // Placeholder pour l'implémentation de production
    console.log('Envoi d\'e-mail en production non configuré');
    return false;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
    return false;
  }
}

/**
 * Génère un e-mail de réinitialisation de mot de passe
 */
export function generatePasswordResetEmail(to: string, resetLink: string): EmailOptions {
  const subject = 'Réinitialisation de votre mot de passe';
  
  const text = `
    Bonjour,
    
    Vous avez demandé la réinitialisation de votre mot de passe.
    
    Veuillez suivre ce lien pour créer un nouveau mot de passe:
    ${resetLink}
    
    Ce lien expirera dans 24 heures.
    
    Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.
    
    Cordialement,
    L'équipe QR Code Pointeuse
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Réinitialisation de votre mot de passe</h2>
      <p>Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Veuillez cliquer sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ce lien expirera dans 24 heures.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.</p>
      <p>Cordialement,<br>L'équipe QR Code Pointeuse</p>
    </div>
  `;
  
  return { to, subject, text, html };
} 