# Capilar Shopping — API (NestJS)

Backend REST para el ecommerce Capilar Shopping. Construido con NestJS + TypeORM + MySQL.

---

## Correr en local

```bash
cp .env.example .env      # configurar credenciales MySQL
npm install
npm run start:dev         # http://localhost:3000/api
npm run seed              # cargar productos y categorías iniciales
```

Verificar: `GET http://localhost:3000/api/health`

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Estado de la API y DB |
| GET | /api/categories | Listar categorías |
| GET | /api/products | Listar productos (`?saleType=retail&search=shampoo`) |
| GET | /api/products/featured | Productos destacados |
| GET | /api/products/:slug | Detalle de producto |
| POST | /api/checkout/create-order | Crear pedido desde el frontend |
| GET | /api/orders | Listar pedidos (admin) |
| PATCH | /api/orders/:id/status | Cambiar estado del pedido |
| PATCH | /api/orders/:id/payment-status | Cambiar estado del pago |
| POST | /api/payments/mercadopago/create-preference | Crear preferencia MP |
| POST | /api/payments/mercadopago/webhook | Webhook de Mercado Pago |
| GET | /api/customers | Listar clientes |

---

## Deploy en Hostinger

### 1. Crear Node.js App en el panel

- Hosting → Node.js → Create Application
- Node.js version: **18 o 20**
- Application startup file: `dist/main.js`

### 2. Subir archivos (sin node_modules ni dist)

### 3. En SSH de Hostinger

```bash
cd ~/capilar-shopping-api
npm install
npm run build
node dist/database/seed.js   # seed inicial
```

### 4. Variables de entorno en Hostinger

```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=u123456_user
DB_PASSWORD=tu_password
DB_DATABASE=u123456_capilar
FRONTEND_URL=https://tu-dominio.com
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx
MERCADOPAGO_WEBHOOK_SECRET=tu_secret
```

### 5. Base MySQL de Hostinger

- Panel → Databases → MySQL Databases
- Crear base: `u123456_capilar`
- Crear usuario con todos los permisos

> En producción, cambiar `synchronize: true` → `false` en `database.config.ts` y usar migraciones TypeORM.

### 6. Verificar

```
GET https://tu-api.com/api/health
```

---

## Conectar el frontend Angular

En `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

Reemplazar los mocks de `ProductService` por `HttpClient` llamando a `/api/products`.

---

## Mercado Pago — integración pendiente

1. `npm install mercadopago`
2. En `payments.service.ts`, reemplazar el bloque `PLACEHOLDER` con el SDK real
3. Configurar el webhook en el panel de MP: `https://tu-api.com/api/payments/mercadopago/webhook`
4. El stock se descuenta automáticamente cuando el `paymentStatus` pasa a `approved`
