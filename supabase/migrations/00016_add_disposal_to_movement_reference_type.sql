-- ============================================================================
-- CHISAN Platform - Add 'disposal' to movement_reference_type enum
-- INV-F004: Support disposal reason for stock-out operations
-- ============================================================================

ALTER TYPE movement_reference_type ADD VALUE 'disposal';

COMMENT ON TYPE movement_reference_type IS 'Types of movement references: import, production, sale, adjustment, transfer, disposal';
