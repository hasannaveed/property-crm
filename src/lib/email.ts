import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface LeadData {
  name: string;
  email: string;
  phone: string;
  budget: number;
  propertyInterest: string;
}

export async function sendNewLeadEmail(lead: LeadData) {
  const budgetFormatted = new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(lead.budget);

  await transporter.sendMail({
    from: `"Property CRM" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `New Lead: ${lead.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">New Lead Received</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#475569;width:140px">Name</td><td style="padding:10px;border-bottom:1px solid #f1f5f9;color:#1e293b">${lead.name}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#475569">Email</td><td style="padding:10px;border-bottom:1px solid #f1f5f9;color:#1e293b">${lead.email}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#475569">Phone</td><td style="padding:10px;border-bottom:1px solid #f1f5f9;color:#1e293b">${lead.phone}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#475569">Budget</td><td style="padding:10px;border-bottom:1px solid #f1f5f9;color:#1e293b">${budgetFormatted}</td></tr>
            <tr><td style="padding:10px;font-weight:600;color:#475569">Interest</td><td style="padding:10px;color:#1e293b">${lead.propertyInterest}</td></tr>
          </table>
        </div>
      </div>
    `,
  });
}

interface AssignmentData {
  agentName: string;
  agentEmail: string;
  lead: LeadData & { _id: string };
}

export async function sendLeadAssignmentEmail({ agentName, agentEmail, lead }: AssignmentData) {
  const budgetFormatted = new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(lead.budget);
  const crmUrl = `${process.env.NEXTAUTH_URL}/agent/leads/${lead._id}`;

  await transporter.sendMail({
    from: `"Property CRM" <${process.env.EMAIL_USER}>`,
    to: agentEmail,
    subject: `Lead Assigned: ${lead.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">Lead Assigned to You</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
          <p style="color:#475569">Hi ${agentName}, a new lead has been assigned to you.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#475569;width:140px">Name</td><td style="padding:10px;border-bottom:1px solid #f1f5f9;color:#1e293b">${lead.name}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#475569">Phone</td><td style="padding:10px;border-bottom:1px solid #f1f5f9;color:#1e293b">${lead.phone}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#475569">Budget</td><td style="padding:10px;border-bottom:1px solid #f1f5f9;color:#1e293b">${budgetFormatted}</td></tr>
            <tr><td style="padding:10px;font-weight:600;color:#475569">Interest</td><td style="padding:10px;color:#1e293b">${lead.propertyInterest}</td></tr>
          </table>
          <a href="${crmUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View in CRM</a>
        </div>
      </div>
    `,
  });
}
