
import { Resend } from 'resend';
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY || "");

export const maxDuration = 50; // This function can run for a maximum of 50 seconds

export async function POST(req:Request) {
    // Assuming you extract the email and otp from the request or some source
    const { email, otp } = await req.json(); // Example of extracting data from the request
  
    // Send the verification email
    await resend.emails.send({
      from: 'Sharkv <help@sharkv.my>',
      to: [email],
      subject: 'Verification OTP',
      html: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; background-color: #f8f8f8; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #007BFF; text-align: center;">Sharkv OTP Verification</h2>
            <p style="font-size: 16px; color: #333;">Hi there,</p>
            <p style="font-size: 16px; color: #333;">
              To complete your login or verification process on Sharkv, please enter the following OTP code:
            </p>
            <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; color: #007BFF;">
              ${otp}
            </div>
            <p style="font-size: 16px; color: #333;">
              This code is valid for the next 10 minutes. If you didn’t request this, please ignore this email.
            </p>
            <p style="font-size: 16px; color: #333;">Thank you for using Sharkv!</p>
            <hr style="border-top: 1px solid #ccc;">
            <footer style="text-align: center; font-size: 12px; color: #888;">
              © ${new Date().getFullYear()}. All rights reserved.
            </footer>
          </div>
        </body>
      </html>
      `,
    });
  
    // Return the HTTP response
    return new Response('Success', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
