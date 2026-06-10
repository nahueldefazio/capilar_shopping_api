import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { Order } from '../orders/entities/order.entity';

interface LegalRequestEmail {
  type: 'arrepentimiento';
  code: string;
  fullName: string;
  email: string;
  phone?: string;
  orderNumber?: string;
  message?: string;
}

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private warnedDisabled = false;

  constructor() {
    const host = process.env.SMTP_HOST;
    this.from = process.env.MAIL_FROM ?? 'Capilar Shopping <no-reply@capilarshopping.com>';

    this.transporter = host
      ? createTransport({
          host,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS ?? '',
              }
            : undefined,
        })
      : null;
  }

  async sendOrderCreated(order: Order): Promise<void> {
    const subject = `Pedido recibido ${order.orderNumber}`;
    const html = this.orderHtml(order, {
      title: 'Recibimos tu pedido',
      intro:
        order.paymentMethod === 'transfer'
          ? 'Te dejamos el detalle de tu compra y los datos para completar la transferencia.'
          : 'Te dejamos el detalle de tu compra. Si el pago queda aprobado, te avisamos por este medio.',
      includeTransfer: order.paymentMethod === 'transfer',
    });

    await this.send(order.customer?.email, subject, html);
    await this.sendAdmin(`Nuevo pedido ${order.orderNumber}`, html);
  }

  async sendPaymentApproved(order: Order): Promise<void> {
    const subject = `Pago aprobado ${order.orderNumber}`;
    const html = this.orderHtml(order, {
      title: 'Tu pago fue aprobado',
      intro: 'Ya confirmamos el pago. Vamos a preparar tu pedido y te avisaremos cuando avance el envío o retiro.',
    });

    await this.send(order.customer?.email, subject, html);
    await this.sendAdmin(`Pago aprobado ${order.orderNumber}`, html);
  }

  async sendShippingUpdated(order: Order): Promise<void> {
    if (!order.shipping) return;

    const tracking = order.shipping.trackingNumber
      ? `<p><strong>Tracking:</strong> ${this.escape(order.shipping.trackingNumber)}</p>`
      : '';
    const trackingUrl = order.shipping.trackingUrl
      ? `<p><a href="${this.escape(order.shipping.trackingUrl)}">Seguir envio</a></p>`
      : '';
    const html = this.wrapHtml(`
      <h1>Actualizacion de envio</h1>
      <p>Tu pedido <strong>${this.escape(order.orderNumber)}</strong> tiene una novedad de envio.</p>
      <p><strong>Estado:</strong> ${this.escape(order.shipping.status)}</p>
      ${tracking}
      ${trackingUrl}
    `);

    await this.send(order.customer?.email, `Envio actualizado ${order.orderNumber}`, html);
  }

  async sendLegalRequest(request: LegalRequestEmail): Promise<void> {
    const html = this.wrapHtml(`
      <h1>Solicitud recibida</h1>
      <p>Registramos tu solicitud de arrepentimiento.</p>
      <p><strong>Codigo:</strong> ${this.escape(request.code)}</p>
      ${request.orderNumber ? `<p><strong>Pedido:</strong> ${this.escape(request.orderNumber)}</p>` : ''}
      <p>Vamos a revisar el caso y responder por este mismo medio.</p>
    `);

    const adminHtml = this.wrapHtml(`
      <h1>Boton de arrepentimiento</h1>
      <p><strong>Codigo:</strong> ${this.escape(request.code)}</p>
      <p><strong>Nombre:</strong> ${this.escape(request.fullName)}</p>
      <p><strong>Email:</strong> ${this.escape(request.email)}</p>
      ${request.phone ? `<p><strong>Telefono:</strong> ${this.escape(request.phone)}</p>` : ''}
      ${request.orderNumber ? `<p><strong>Pedido:</strong> ${this.escape(request.orderNumber)}</p>` : ''}
      ${request.message ? `<p><strong>Mensaje:</strong> ${this.escape(request.message)}</p>` : ''}
    `);

    await this.send(request.email, `Solicitud registrada ${request.code}`, html);
    await this.sendAdmin(`Arrepentimiento ${request.code}`, adminHtml);
  }

  private async send(to: string | undefined, subject: string, html: string): Promise<void> {
    if (!to) return;
    if (!this.transporter) {
      if (!this.warnedDisabled) {
        this.warnedDisabled = true;
        this.logger.warn('SMTP_HOST no configurado: los emails transaccionales estan desactivados');
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text: this.toText(html),
      });
    } catch (err) {
      this.logger.error(`No se pudo enviar email "${subject}" a ${to}`, err);
    }
  }

  private sendAdmin(subject: string, html: string): Promise<void> {
    return this.send(process.env.ADMIN_EMAIL, subject, html);
  }

  private orderHtml(
    order: Order,
    options: { title: string; intro: string; includeTransfer?: boolean },
  ): string {
    const rows = order.items
      .map(
        (item) => `
          <tr>
            <td>${this.escape(item.productName)}</td>
            <td style="text-align:center">${item.quantity}</td>
            <td style="text-align:right">${this.money(item.subtotal)}</td>
          </tr>
        `,
      )
      .join('');

    const transfer = options.includeTransfer
      ? `
        <h2>Datos para transferencia</h2>
        <p><strong>Titular:</strong> ${this.escape(process.env.TRANSFER_HOLDER ?? 'Nahuel de Fazio')}</p>
        <p><strong>CUIT/CUIL:</strong> ${this.escape(process.env.TRANSFER_TAX_ID ?? '20-39185800-5')}</p>
        <p><strong>CBU/CVU:</strong> ${this.escape(process.env.TRANSFER_CBU ?? '0000003100078452726210')}</p>
        <p><strong>Alias:</strong> ${this.escape(process.env.TRANSFER_ALIAS ?? 'nahuel.defazio')}</p>
        <p>Cuando tengas el comprobante, envianoslo por WhatsApp para validar el pago.</p>
      `
      : '';

    return this.wrapHtml(`
      <h1>${this.escape(options.title)}</h1>
      <p>${this.escape(options.intro)}</p>
      <p><strong>Pedido:</strong> ${this.escape(order.orderNumber)}</p>
      <p><strong>Total:</strong> ${this.money(order.total)}</p>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
        <thead>
          <tr>
            <th align="left">Producto</th>
            <th>Cant.</th>
            <th align="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${transfer}
    `);
  }

  private wrapHtml(content: string): string {
    return `
      <div style="font-family:Arial,sans-serif;color:#2f241f;line-height:1.5;max-width:640px;margin:0 auto">
        ${content}
        <hr style="border:none;border-top:1px solid #eadbd3;margin:24px 0" />
        <p style="font-size:12px;color:#7d6b63">Capilar Shopping</p>
      </div>
    `;
  }

  private money(value: number | string): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(Number(value));
  }

  private escape(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private toText(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
