-- ============================================================================
-- CHISAN Platform - Shipment to Stock Integration
-- Adds destination location to shipments for automatic stock-in creation
-- ============================================================================

-- ============================================================================
-- Add destination_location_id to shipments table
-- ============================================================================

ALTER TABLE shipments 
ADD COLUMN destination_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Index for location lookups
CREATE INDEX IF NOT EXISTS idx_shipments_destination_location 
ON shipments(destination_location_id) 
WHERE destination_location_id IS NOT NULL;

-- ============================================================================
-- Add shipment reference to stocks table for traceability
-- ============================================================================

ALTER TABLE stocks
ADD COLUMN shipment_item_id UUID REFERENCES shipment_items(id) ON DELETE SET NULL;

-- Index for shipment-to-stock lookups
CREATE INDEX IF NOT EXISTS idx_stocks_shipment_item 
ON stocks(shipment_item_id) 
WHERE shipment_item_id IS NOT NULL;

-- ============================================================================
-- Add shipment reference type to stock_movements
-- ============================================================================

ALTER TYPE movement_reference_type ADD VALUE IF NOT EXISTS 'shipment';

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN shipments.destination_location_id IS 'Warehouse location where goods will be received. Required for automatic stock-in creation.';
COMMENT ON COLUMN stocks.shipment_item_id IS 'Reference to the shipment item that created this stock record during import receiving.';
