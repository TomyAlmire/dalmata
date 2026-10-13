/**
 * Servicio para enviar correos electrónicos mediante EmailJS.
 * Utiliza la API REST de EmailJS para evitar dependencias externas pesadas.
 */

async function sendOrderEmail(cart, meta = {}) {
  const publicKey = window.DALMATA_EMAILJS_PUBLIC_KEY;
  const serviceId = window.DALMATA_EMAILJS_SERVICE_ID;
  const templateId = window.DALMATA_EMAILJS_TEMPLATE_ID;

  if (!publicKey || !serviceId || !templateId) {
    console.warn("EmailJS no está configurado. El pedido se guardó en Supabase pero no se envió correo.");
    return true; // Retornamos true para no bloquear el flujo del usuario si solo falla el mail
  }

  // Formatear los productos como filas de tabla (compatible con la plantilla de
  // emails/confirmacion-pedido.html, pensada para EmailJS).
  const itemsHtml = cart.map(item => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #e6e6e6;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111111;padding-bottom:4px;">
              ${item.name} <span style="font-weight:400;color:#777777;">&times; ${item.quantity}</span>
            </td>
            <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111111;white-space:nowrap;">
              $${(item.price * item.quantity).toLocaleString('es-AR')}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#777777;padding-top:2px;">
              Talle ${item.size} · ${item.colorLabel}${item.customized ? ' · Personalizado' : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const templateParams = {
    user_email: meta.email || 'No proporcionado',
    items_html: itemsHtml,
    total_price: `$${total.toLocaleString('es-AR')}`,
    order_date: new Date().toLocaleString('es-AR'),
    // Estos campos deben coincidir con los placeholders {{...}} en la plantilla de EmailJS
  };

  const data = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: templateParams
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log('Email enviado correctamente');
      return true;
    } else {
      const errorText = await response.text();
      console.error('Error al enviar EmailJS:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error de red al enviar EmailJS:', error);
    return false;
  }
}
