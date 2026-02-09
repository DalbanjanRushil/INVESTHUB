import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, message } = body;

        if (!firstName || !lastName || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const adminEmail = process.env.EMAIL_USER || 'rushil.ikkasa@gmail.com';
        const fullName = `${firstName} ${lastName}`;

        // Email to Admin
        const emailResult = await sendEmail({
            to: adminEmail,
            subject: `New Inquiry from ${fullName} - InvestHub Contact`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #10B981;">New Contact Inquiry</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; border-left: 4px solid #10B981;">
            ${message}
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">This email was sent from the InvestHub Contact Form.</p>
        </div>
      `,
        });

        if (!emailResult.success) {
            throw new Error('Failed to send email');
        }

        return NextResponse.json({ success: true, message: 'Inquiry sent successfully' });

    } catch (error) {
        console.error('Contact API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
