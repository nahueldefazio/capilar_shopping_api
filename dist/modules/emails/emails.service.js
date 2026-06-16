"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailsService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = require("nodemailer");
let EmailsService = EmailsService_1 = class EmailsService {
    logger = new common_1.Logger(EmailsService_1.name);
    transporter;
    from;
    warnedDisabled = false;
    constructor() {
        const host = process.env.SMTP_HOST;
        this.from = process.env.MAIL_FROM ?? 'Luvira <no-reply@capilarshopping.com>';
        this.transporter = host
            ? (0, nodemailer_1.createTransport)({
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
    async sendOrderCreated(order) {
        const subject = `Reserva recibida ${order.orderNumber}`;
        const html = this.orderHtml(order, {
            title: 'Recibimos tu solicitud de reserva',
            intro: 'Te dejamos el detalle del presupuesto estimado. Te contactaremos para confirmar disponibilidad, envio y pasos siguientes.',
        });
        await this.send(order.customer?.email, subject, html);
        await this.sendAdmin(`Nueva reserva ${order.orderNumber}`, html);
    }
    async sendShippingUpdated(order) {
        if (!order.shipping)
            return;
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
    async sendLegalRequest(request) {
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
    async send(to, subject, html) {
        if (!to)
            return;
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
        }
        catch (err) {
            this.logger.error(`No se pudo enviar email "${subject}" a ${to}`, err);
        }
    }
    sendAdmin(subject, html) {
        return this.send(process.env.ADMIN_EMAIL, subject, html);
    }
    orderHtml(order, options) {
        const rows = order.items
            .map((item) => `
          <tr>
            <td>${this.escape(item.productName)}</td>
            <td style="text-align:center">${item.quantity}</td>
            <td style="text-align:right">${this.money(item.subtotal)}</td>
          </tr>
        `)
            .join('');
        return this.wrapHtml(`
      <h1>${this.escape(options.title)}</h1>
      <p>${this.escape(options.intro)}</p>
      <p><strong>Reserva:</strong> ${this.escape(order.orderNumber)}</p>
      <p><strong>Total estimado:</strong> ${this.money(order.total)}</p>
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
    `);
    }
    wrapHtml(content) {
        return `
      <div style="font-family:Arial,sans-serif;color:#2f241f;line-height:1.5;max-width:640px;margin:0 auto">
        ${content}
        <hr style="border:none;border-top:1px solid #eadbd3;margin:24px 0" />
        <p style="font-size:12px;color:#7d6b63">Luvira</p>
      </div>
    `;
    }
    money(value) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(Number(value));
    }
    escape(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    toText(html) {
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
};
exports.EmailsService = EmailsService;
exports.EmailsService = EmailsService = EmailsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailsService);
//# sourceMappingURL=emails.service.js.map