export const passwordResetTemplate = (resetURL, userName = "Customer") => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin:0; padding:0; background:#eef3f1; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef3f1">
    <tr>
      <td align="center" style="padding:40px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:22px; overflow:hidden; box-shadow:0 15px 40px rgba(0,0,0,.08);">

          <!-- Green Header -->
          <tr>
            <td align="center" style="background:linear-gradient(180deg,#014421,#066534); padding:40px 30px;">
              <h1 style="margin:25px 0 10px; font-size:40px; font-weight:bold; color:white;">
                PakCartify
              </h1>
              <p style="margin:0; font-size:16px; color:#d7ffe6;">
                - Shop More, Save More -
              </p>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td align="center" style="padding:35px 30px 20px;">
              <div style="width:90px; height:90px; background:#ebfbf1; border-radius:70px; line-height:90px; font-size:42px; margin:auto;">
                🔐
              </div>

              <h2 style="font-size:30px; margin:35px 0 15px; color:#222;">
                Password Reset Request
              </h2>

              <p style="font-size:22px; font-weight:bold; color:#0b6b3a; margin:0;">
                Hi ${userName},
              </p>

              <p style="margin:30px auto; max-width:560px; font-size:16px; line-height:28px; color:#555;">
                We received a request to reset your
                <strong>PakCartify</strong> account password.
                Please click the button below to create
                a new password.
              </p>

              <!-- Reset Button -->
              <a href="${resetURL}" style="display:inline-block; background:#0b6b3a; color:#ffffff; text-decoration:none; font-size:18px; font-weight:bold; padding:14px 36px; border-radius:12px; margin:20px 0 40px;">
                Reset My Password
              </a>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:15px 0 35px;">
                <tr>
                  <td width="42%">
                    <hr style="border:none; border-top:1px solid #dddddd;">
                  </td>
                  <td align="center" style="font-size:18px; font-weight:bold; color:#888;">
                    OR
                  </td>
                  <td width="42%">
                    <hr style="border:none; border-top:1px solid #dddddd;">
                  </td>
                </tr>
              </table>

              <p style="font-size:18px; color:#555; line-height:30px; margin-bottom:18px;">
                If the button doesn't work,
                copy and paste this link into your browser.
              </p>

              <!-- Link Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5fff8; border:1px solid #ccebd7; border-radius:12px; margin-bottom:35px;">
                <tr>
                  <td style="padding:16px; font-size:14px; color:#0b6b3a; word-break:break-all; font-weight:bold;">
                    ${resetURL}
                  </td>
                </tr>
              </table>

              <!-- Expiry Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fffb; border:1px solid #d7f0e1; border-radius:14px; margin-bottom:30px;">
                <tr>
                  <td style="padding:18px; font-size:15px; line-height:26px; color:#333;">
                    ✅ <strong>This password reset link will expire in 5 minutes.</strong>
                    <br><br>
                    If you didn't request a password reset,
                    please ignore this email.
                    No changes have been made to your account.
                  </td>
                </tr>
              </table>

              <!-- Security Tip -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffaf1; border:1px solid #f2d28a; border-radius:14px;">
                <tr>
                  <td style="padding:18px; font-size:15px; line-height:26px; color:#444;">
                    🔒 <strong>Security Tip</strong>
                    <br><br>
                    Never share your password with anyone.
                    PakCartify will never ask for your password
                    through email, phone call or SMS.
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:45px; border-top:1px solid #eeeeee;">
                <tr>
                  <td align="center" style="padding-bottom:12px; padding-top:30px; font-size:18px; color:#666;">
                    © 2026 PakCartify. All rights reserved.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:45px; font-size:16px; color:#0b6b3a; font-weight:bold;">
                    PakCartify
                    <span style="color:#777; font-weight:normal;">
                      — Shop More, Save More -
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};