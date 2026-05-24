export enum PaymentMethod {
  MERCADOPAGO = 'mercadopago',
  TRANSFER = 'transfer',
  CASH = 'cash',
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  MERCADOPAGO = 'mercadopago',
  MANUAL = 'manual',
}
