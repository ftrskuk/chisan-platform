ALTER TABLE stock_movements ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_order ON stock_movements(order_id) WHERE order_id IS NOT NULL;

ALTER TABLE stocks ADD COLUMN qr_code VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stocks_qr_code ON stocks(qr_code) WHERE qr_code IS NOT NULL;

COMMENT ON COLUMN stock_movements.order_id IS 'Reference to the order that triggered this movement';
COMMENT ON COLUMN stocks.qr_code IS 'QR code for label printing and scanning';
