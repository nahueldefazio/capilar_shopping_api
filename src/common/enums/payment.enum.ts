export enum PaymentMethod {
  RESERVATION = 'reservation',
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
