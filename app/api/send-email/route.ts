import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const data = await req.json()

    const email = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['lheowriter@gmail.com'],
      subject: 'New OFarming Intake',
      html: `
        <h2>New Intake</h2>
        <p><strong>Type:</strong> ${data.type}</p>
        <p><strong>Company:</strong> ${data.company}</p>
        <p><strong>Contact:</strong> ${data.contact}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Product:</strong> ${data.product}</p>
        <p><strong>Volume:</strong> ${data.volume}</p>
        <p><strong>Location:</strong> ${data.geography}</p>
        <p><strong>Terms:</strong> ${data.terms}</p>
        <p><strong>Notes:</strong> ${data.notes}</p>
      `,
    })

    return Response.json({ success: true, email })
  } catch (err) {
    return Response.json({ error: 'Email failed' }, { status: 500 })
  }
}