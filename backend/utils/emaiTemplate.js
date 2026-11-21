const formatPKR = (amount) =>
  `Rs. ${Number(amount).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export const otpEmailTemplate = (name, otp) => {
  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0; padding:0; background-color:#F2F7F4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F7F4; padding: 30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; font-family: Arial, Helvetica, sans-serif;">

            <tr>
              <td style="background-color:#0B3D22; padding: 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:20px; font-weight:bold;"><span style="color:#ffffff;">Pak</span><span style="color:#7ED384;">Cartify</span></td>
                    <td align="right" style="color:#CFE8D8; font-size:12px;">Email verification</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#EAF3E6; padding: 36px 32px 28px;">
                <h1 style="margin:0; font-size:28px; color:#14161F; font-weight:bold; line-height:1.3;">Verify your<br/><span style="color:#0F6E56;">email address</span></h1>
                <p style="margin:14px 0 0; font-size:14px; color:#3F4A44; line-height:1.6;">Hi ${name}, use the OTP below to complete your PakCartify registration.</p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding: 28px 32px 8px;">
                <p style="margin:0 0 12px; font-size:13px; color:#6B7280;">Your one-time password</p>
                <div style="display:inline-block; background-color:#F7FAF8; border:2px dashed #0F6E56; border-radius:12px; padding:18px 36px;">
                  <span style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#0F6E56;">${otp}</span>
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding: 8px 32px 28px;">
                <p style="margin:0; font-size:13px; color:#EF4444; font-weight:bold;">This OTP expires in 1 minute.</p>
                <p style="margin:10px 0 0; font-size:12px; color:#9CA3AF;">If it expires, click Resend OTP on the verification page.</p>
              </td>
            </tr>

            <tr>
              <td style="background-color:#0B3D22; padding: 22px 32px; text-align:center;">
                <p style="margin:0; font-size:11px; color:#7FA592;">© ${new Date().getFullYear()} PakCartify. All rights reserved.</p>
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

export const orderConfirmationEmailTemplate = ({
  name,
  orderId,
  orderItems,
  shippingInfo,
  itemsPrice,
  taxPrice,
  shippingPrice,
  discountAmount,
  totalPrice,
  paymentMethod,
  orderDate,
}) => {
  const formattedDate = new Date(orderDate).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const orderRef = orderId.toString().slice(-6).toUpperCase();

  const itemsRows = orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0; font-size:13px; color:#14161F; border-bottom:1px solid #E3EFE9;">
          ${item.name} × ${item.quantity}
        </td>
        <td style="padding:12px 0; font-size:13px; color:#0F6E56; text-align:right; border-bottom:1px solid #E3EFE9;">
          ${formatPKR(item.price * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  const discountRow =
    discountAmount > 0
      ? `<tr>
          <td style="padding:8px 0; font-size:13px; color:#6B7280;">Discount</td>
          <td style="padding:8px 0; font-size:13px; color:#0F6E56; text-align:right;">- ${formatPKR(discountAmount)}</td>
        </tr>`
      : "";

  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0; padding:0; background-color:#F2F7F4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F7F4; padding: 30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; font-family: Arial, Helvetica, sans-serif;">

            <tr>
              <td style="background-color:#0B3D22; padding: 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:20px; font-weight:bold;"><span style="color:#ffffff;">Pak</span><span style="color:#7ED384;">Cartify</span></td>
                    <td align="right" style="color:#CFE8D8; font-size:12px;">Order confirmation</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#EAF3E6; padding: 36px 32px 28px;">
                <h1 style="margin:0; font-size:28px; color:#14161F; font-weight:bold; line-height:1.3;">Thank you for<br/><span style="color:#0F6E56;">your order!</span></h1>
                <p style="margin:14px 0 0; font-size:14px; color:#3F4A44; line-height:1.6;">Hi ${name}, we've received your order and it's being processed.</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7FAF8; border-radius:8px;">
                  <tr>
                    <td style="padding:14px 18px; font-size:13px; color:#6B7280; border-bottom:1px solid #E3EFE9;">Order #</td>
                    <td style="padding:14px 18px; font-size:13px; color:#0F6E56; text-align:right; border-bottom:1px solid #E3EFE9;">${orderRef}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 18px; font-size:13px; color:#6B7280; border-bottom:1px solid #E3EFE9;">Placed on</td>
                    <td style="padding:14px 18px; font-size:13px; color:#14161F; text-align:right; border-bottom:1px solid #E3EFE9;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 18px; font-size:13px; color:#6B7280;">Payment</td>
                    <td style="padding:14px 18px; font-size:13px; color:#14161F; text-align:right;">${paymentMethod === "COD" ? "Cash on Delivery" : paymentMethod}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 22px 32px 0;">
                <p style="margin:0 0 10px; font-size:14px; font-weight:bold; color:#14161F;">Order items</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${itemsRows}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 16px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7FAF8; border-radius:8px;">
                  <tr>
                    <td style="padding:14px 18px; font-size:13px; color:#6B7280;">Subtotal</td>
                    <td style="padding:14px 18px; font-size:13px; color:#14161F; text-align:right;">${formatPKR(itemsPrice)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 18px; font-size:13px; color:#6B7280;">Shipping</td>
                    <td style="padding:8px 18px; font-size:13px; color:#14161F; text-align:right;">${shippingPrice === 0 ? "FREE" : formatPKR(shippingPrice)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 18px; font-size:13px; color:#6B7280;">Tax</td>
                    <td style="padding:8px 18px; font-size:13px; color:#14161F; text-align:right;">${formatPKR(taxPrice)}</td>
                  </tr>
                  ${discountRow}
                  <tr>
                    <td style="padding:14px 18px; font-size:14px; font-weight:bold; color:#14161F; border-top:1px solid #E3EFE9;">Total</td>
                    <td style="padding:14px 18px; font-size:14px; font-weight:bold; color:#0F6E56; text-align:right; border-top:1px solid #E3EFE9;">${formatPKR(totalPrice)}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 22px 32px 0;">
                <p style="margin:0 0 10px; font-size:14px; font-weight:bold; color:#14161F;">Delivery address</p>
                <p style="margin:0; font-size:13px; color:#4B5563; line-height:1.7; background-color:#F7FAF8; border-radius:8px; padding:14px 18px;">
                  ${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.pinCode}, ${shippingInfo.country}<br/>
                  Phone: ${shippingInfo.PhoneNumber}
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding: 26px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#0F6E56; border-radius:8px;">
                      <a href="http://localhost:5173/order/user" style="display:inline-block; padding:13px 34px; font-size:14px; font-weight:bold; color:#ffffff; text-decoration:none;">Track your order</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#0B3D22; padding: 22px 32px; text-align:center;">
                <p style="margin:0; font-size:11px; color:#7FA592;">© ${new Date().getFullYear()} PakCartify. All rights reserved.</p>
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

export const orderDeliveredEmailTemplate = ({
  name,
  orderId,
  orderItems,
  deliveredAt,
}) => {
  const formattedDate = new Date(deliveredAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const orderRef = orderId.toString().slice(-6).toUpperCase();

  const reviewItems = orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0; border-bottom:1px solid #E3EFE9;">
          <p style="margin:0 0 8px; font-size:14px; font-weight:bold; color:#14161F;">${item.name}</p>
          <a href="http://localhost:5173/product/${item.product}" style="display:inline-block; padding:10px 18px; font-size:13px; font-weight:bold; color:#ffffff; background-color:#0F6E56; border-radius:8px; text-decoration:none;">Leave a review</a>
        </td>
      </tr>`,
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0; padding:0; background-color:#F2F7F4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F7F4; padding: 30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; font-family: Arial, Helvetica, sans-serif;">

            <tr>
              <td style="background-color:#0B3D22; padding: 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:20px; font-weight:bold;"><span style="color:#ffffff;">Pak</span><span style="color:#7ED384;">Cartify</span></td>
                    <td align="right" style="color:#CFE8D8; font-size:12px;">Order delivered</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#EAF3E6; padding: 36px 32px 28px;">
                <h1 style="margin:0; font-size:28px; color:#14161F; font-weight:bold; line-height:1.3;">Your order has<br/><span style="color:#0F6E56;">been delivered!</span></h1>
                <p style="margin:14px 0 0; font-size:14px; color:#3F4A44; line-height:1.6;">Hi ${name}, we hope you love your purchase. Order #${orderRef} was delivered on ${formattedDate}.</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7FAF8; border-radius:10px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="margin:0 0 8px; font-size:15px; font-weight:bold; color:#0F6E56;">How was your experience?</p>
                      <p style="margin:0; font-size:13px; color:#4B5563; line-height:1.7;">Your feedback helps other shoppers and helps us improve. Please take a moment to review the items you received.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 22px 32px 0;">
                <p style="margin:0 0 10px; font-size:14px; font-weight:bold; color:#14161F;">Review your items</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${reviewItems}
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding: 26px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#0F6E56; border-radius:8px;">
                      <a href="http://localhost:5173/order/user" style="display:inline-block; padding:13px 34px; font-size:14px; font-weight:bold; color:#ffffff; text-decoration:none;">View order history</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#0B3D22; padding: 22px 32px; text-align:center;">
                <p style="margin:0; font-size:11px; color:#7FA592;">© ${new Date().getFullYear()} PakCartify. All rights reserved.</p>
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

export const welcomeEmailTemplate = (name, toEmail, joinedDate) => {
  const formattedDate = new Date(joinedDate).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0; padding:0; background-color:#F2F7F4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F7F4; padding: 30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; font-family: Arial, Helvetica, sans-serif;">

            <tr>
              <td style="background-color:#0B3D22; padding: 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:20px; font-weight:bold;"><span style="color:#ffffff;">Pak</span><span style="color:#7ED384;">Cartify</span></td>
                    <td align="right" style="color:#CFE8D8; font-size:12px;">Your trusted online store</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#EAF3E6; padding: 36px 32px 28px;">
                <h1 style="margin:0; font-size:28px; color:#14161F; font-weight:bold; line-height:1.3;">Welcome to<br/><span style="color:#0F6E56;">PakCatrify!</span></h1>
                <p style="margin:14px 0 0; font-size:14px; color:#3F4A44; line-height:1.6;">Thank you for signing up with us.<br/>Your account has been created successfully.</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7FAF8; border-radius:10px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="margin:0 0 8px; font-size:15px; font-weight:bold; color:#0F6E56;">Hi ${name},</p>
                      <p style="margin:0; font-size:13px; color:#4B5563; line-height:1.7;">We're excited to have you on board. You can now explore thousands of products, enjoy great deals and a smooth shopping experience.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 22px 32px 0;">
                <p style="margin:0 0 10px; font-size:14px; font-weight:bold; color:#14161F;">Your account details</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7FAF8; border-radius:8px;">
                  <tr>
                    <td style="padding:14px 18px; font-size:13px; color:#6B7280; border-bottom:1px solid #E3EFE9;">Email</td>
                    <td style="padding:14px 18px; font-size:13px; color:#0F6E56; text-align:right; border-bottom:1px solid #E3EFE9;">${toEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 18px; font-size:13px; color:#6B7280;">Joined on</td>
                    <td style="padding:14px 18px; font-size:13px; color:#14161F; text-align:right;">${formattedDate}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding: 26px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#0F6E56; border-radius:8px;">
                      <a href="http://localhost:5173/" style="display:inline-block; padding:13px 34px; font-size:14px; font-weight:bold; color:#ffffff; text-decoration:none;">Start shopping now</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 20px 26px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="25%" align="center" style="font-size:11px; color:#4B5563;">
                      <div style="font-size:20px;">🛡️</div>
                      <div style="font-weight:bold; margin-top:4px;">Secure</div>
                      <div style="color:#9AA0AC;">100% safe</div>
                    </td>
                    <td width="25%" align="center" style="font-size:11px; color:#4B5563;">
                      <div style="font-size:20px;">🚚</div>
                      <div style="font-weight:bold; margin-top:4px;">Fast delivery</div>
                      <div style="color:#9AA0AC;">Quick & reliable</div>
                    </td>
                    <td width="25%" align="center" style="font-size:11px; color:#4B5563;">
                      <div style="font-size:20px;">📦</div>
                      <div style="font-weight:bold; margin-top:4px;">Easy returns</div>
                      <div style="color:#9AA0AC;">Hassle-free</div>
                    </td>
                    <td width="25%" align="center" style="font-size:11px; color:#4B5563;">
                      <div style="font-size:20px;">🎧</div>
                      <div style="font-weight:bold; margin-top:4px;">24/7 support</div>
                      <div style="color:#9AA0AC;">Always here</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#0B3D22; padding: 22px 32px; text-align:center;">
                <p style="margin:0; font-size:11px; color:#7FA592;">© ${new Date().getFullYear()} PakCartify. All rights reserved.</p>
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