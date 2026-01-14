
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
    const from = process.env.EMAIL_USER || 'rushil.ikkasa@gmail.com';

    try {
        const info = await transporter.sendMail({
            from: `"InvestHub" <${from}>`,
            to,
            subject,
            text,
            html,
        });

        console.log(`Message sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}
