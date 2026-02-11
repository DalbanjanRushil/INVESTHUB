export const styles = {
    container: `font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);`,
    header: `background-color: #111827; padding: 30px 24px; text-align: center; background-image: linear-gradient(to right, #111827, #1f2937);`,
    headerText: `color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px; font-family: 'Helvetica Neue', Arial, sans-serif;`,
    body: `padding: 32px 24px; color: #374151; line-height: 1.6;`,
    greeting: `font-size: 18px; margin-bottom: 16px; color: #111827; font-weight: 600;`,
    table: `width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;`,
    tdLabel: `padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e5e7eb; width: 40%; background-color: #f3f4f6;`,
    tdValue: `padding: 12px 16px; color: #111827; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb;`,
    footer: `background-color: #f3f4f6; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;`,
};

export function generateEmailHtml(userName: string, title: string, contentHtml: string) {
    return `
        <div style="${styles.container}">
            <div style="${styles.header}">
                <h1 style="${styles.headerText}">INVESTHUB</h1>
            </div>
            <div style="${styles.body}">
                <p style="${styles.greeting}">Hello ${userName},</p>
                <h2 style="font-size: 20px; color: #111827; margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; display: inline-block;">${title}</h2>
                ${contentHtml}
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,</p>
                    <p style="margin: 4px 0 0 0; color: #111827; font-weight: 600;">The InvestHub Team</p>
                </div>
            </div>
            <div style="${styles.footer}">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} InvestHub. All rights reserved.</p>
                <p style="margin: 8px 0 0 0;">This is an automated notification. Please do not reply to this email.</p>
                <div style="margin-top: 16px;">
                    <a href="#" style="color: #3b82f6; text-decoration: none; margin: 0 8px;">Privacy Policy</a>
                    <span style="color: #cbd5e1;">|</span>
                    <a href="#" style="color: #3b82f6; text-decoration: none; margin: 0 8px;">Terms of Service</a>
                </div>
            </div>
        </div>
    `;
}

export function generateTableHtml(rows: { label: string; value: string }[]) {
    const rowsHtml = rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const borderStyle = isLast ? 'border-bottom: none;' : '';
        return `
            <tr>
                <td style="${styles.tdLabel} ${borderStyle}">${row.label}</td>
                <td style="${styles.tdValue} ${borderStyle}">${row.value}</td>
            </tr>
        `;
    }).join('');

    return `<table style="${styles.table}">${rowsHtml}</table>`;
}
