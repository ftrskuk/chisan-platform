-- ============================================================================
-- CHISAN Platform - Search Stocks RPC Function
-- INV-F001: Server-side search with proper pagination for stock inventory
-- ============================================================================
-- This function handles the 'q' search parameter server-side, searching
-- across item_code and display_name fields in the items table.
-- Fixes the client-side filtering issue that breaks pagination accuracy.
-- ============================================================================

-- ============================================================================
-- Function: Search Stocks with Server-Side Text Search
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_stocks(
  p_warehouse_id UUID DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_item_id UUID DEFAULT NULL,
  p_width_mm INTEGER DEFAULT NULL,
  p_width_min INTEGER DEFAULT NULL,
  p_width_max INTEGER DEFAULT NULL,
  p_condition TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result_data JSONB;
  total_count BIGINT;
  search_pattern TEXT;
BEGIN
  -- Prepare search pattern for ILIKE
  IF p_search_query IS NOT NULL AND p_search_query <> '' THEN
    search_pattern := '%' || LOWER(p_search_query) || '%';
  END IF;

  -- Get total count first
  SELECT COUNT(*)
  INTO total_count
  FROM public.stocks s
  INNER JOIN public.items i ON s.item_id = i.id
  INNER JOIN public.locations l ON s.location_id = l.id
  WHERE
    -- Warehouse filter (through location)
    (p_warehouse_id IS NULL OR l.warehouse_id = p_warehouse_id)
    -- Location filter
    AND (p_location_id IS NULL OR s.location_id = p_location_id)
    -- Item filter
    AND (p_item_id IS NULL OR s.item_id = p_item_id)
    -- Width filters
    AND (p_width_mm IS NULL OR s.width_mm = p_width_mm)
    AND (p_width_min IS NULL OR s.width_mm >= p_width_min)
    AND (p_width_max IS NULL OR s.width_mm <= p_width_max)
    -- Condition filter
    AND (p_condition IS NULL OR s.condition::TEXT = p_condition)
    -- Status filter
    AND (p_status IS NULL OR s.status::TEXT = p_status)
    -- Active filter
    AND (p_is_active IS NULL OR s.is_active = p_is_active)
    -- Text search filter (item_code and display_name)
    AND (
      search_pattern IS NULL
      OR LOWER(i.item_code) LIKE search_pattern
      OR LOWER(i.display_name) LIKE search_pattern
    );

  -- Get paginated data with all relations
  SELECT COALESCE(jsonb_agg(row_data ORDER BY created_at DESC), '[]'::JSONB)
  INTO result_data
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'itemId', s.item_id,
      'locationId', s.location_id,
      'widthMm', s.width_mm,
      'weightKg', s.weight_kg,
      'quantity', s.quantity,
      'condition', s.condition,
      'status', s.status,
      'isActive', s.is_active,
      'batchNumber', s.batch_number,
      'lotNumber', s.lot_number,
      'receivedAt', s.received_at,
      'sourceType', s.source_type,
      'notes', s.notes,
      'createdAt', s.created_at,
      'updatedAt', s.updated_at,
      'item', jsonb_build_object(
        'id', i.id,
        'paperTypeId', i.paper_type_id,
        'brandId', i.brand_id,
        'itemCode', i.item_code,
        'displayName', i.display_name,
        'basisWeight', i.basis_weight,
        'thickness', i.thickness,
        'form', i.form,
        'countryOfOrigin', i.country_of_origin,
        'defaultUnit', i.default_unit,
        'isActive', i.is_active,
        'notes', i.notes,
        'createdAt', i.created_at,
        'updatedAt', i.updated_at,
        'paperType', jsonb_build_object(
          'id', pt.id,
          'code', pt.code,
          'nameKo', pt.name_ko,
          'nameEn', pt.name_en,
          'category', pt.category,
          'isActive', pt.is_active,
          'notes', pt.notes,
          'createdAt', pt.created_at,
          'updatedAt', pt.updated_at
        ),
        'brand', CASE WHEN b.id IS NOT NULL THEN jsonb_build_object(
          'id', b.id,
          'partnerId', b.partner_id,
          'code', b.code,
          'name', b.name,
          'nameEn', b.name_en,
          'isActive', b.is_active,
          'notes', b.notes,
          'createdAt', b.created_at,
          'updatedAt', b.updated_at
        ) ELSE NULL END
      ),
      'location', jsonb_build_object(
        'id', l.id,
        'warehouseId', l.warehouse_id,
        'code', l.code,
        'name', l.name,
        'type', l.type,
        'parentId', l.parent_id,
        'isActive', l.is_active,
        'notes', l.notes,
        'createdAt', l.created_at,
        'updatedAt', l.updated_at
      ),
      'warehouse', jsonb_build_object(
        'id', w.id,
        'code', w.code,
        'name', w.name,
        'address', w.address,
        'city', w.city,
        'postalCode', w.postal_code,
        'contactName', w.contact_name,
        'contactPhone', w.contact_phone,
        'isActive', w.is_active,
        'isDefault', w.is_default,
        'notes', w.notes,
        'createdAt', w.created_at,
        'updatedAt', w.updated_at
      )
    ) AS row_data,
    s.created_at
    FROM public.stocks s
    INNER JOIN public.items i ON s.item_id = i.id
    INNER JOIN public.paper_types pt ON i.paper_type_id = pt.id
    LEFT JOIN public.brands b ON i.brand_id = b.id
    INNER JOIN public.locations l ON s.location_id = l.id
    INNER JOIN public.warehouses w ON l.warehouse_id = w.id
    WHERE
      -- Warehouse filter (through location)
      (p_warehouse_id IS NULL OR l.warehouse_id = p_warehouse_id)
      -- Location filter
      AND (p_location_id IS NULL OR s.location_id = p_location_id)
      -- Item filter
      AND (p_item_id IS NULL OR s.item_id = p_item_id)
      -- Width filters
      AND (p_width_mm IS NULL OR s.width_mm = p_width_mm)
      AND (p_width_min IS NULL OR s.width_mm >= p_width_min)
      AND (p_width_max IS NULL OR s.width_mm <= p_width_max)
      -- Condition filter
      AND (p_condition IS NULL OR s.condition::TEXT = p_condition)
      -- Status filter
      AND (p_status IS NULL OR s.status::TEXT = p_status)
      -- Active filter
      AND (p_is_active IS NULL OR s.is_active = p_is_active)
      -- Text search filter (item_code and display_name)
      AND (
        search_pattern IS NULL
        OR LOWER(i.item_code) LIKE search_pattern
        OR LOWER(i.display_name) LIKE search_pattern
      )
    ORDER BY s.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) subq;

  -- Return structured response
  RETURN jsonb_build_object(
    'data', result_data,
    'total', total_count,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$;

-- ============================================================================
-- Security: Grant access to service_role only
-- ============================================================================

REVOKE ALL ON FUNCTION public.search_stocks(
  UUID, UUID, UUID, INTEGER, INTEGER, INTEGER, TEXT, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.search_stocks(
  UUID, UUID, UUID, INTEGER, INTEGER, INTEGER, TEXT, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER
) TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION public.search_stocks IS 'Server-side stock search with ILIKE text matching on item_code and display_name, proper pagination support';
