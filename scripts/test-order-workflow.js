#!/usr/bin/env node

/**
 * E2E Order Workflow Test Script
 * Tests the complete order workflow via API with service role bypass
 *
 * Usage: node scripts/test-order-workflow.js
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://bnskrqopbzdlinvpickz.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc2tycW9wYnpkbGludnBpY2t6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM3Mjk2MSwiZXhwIjoyMDgzOTQ4OTYxfQ.MFG3Ol9zhYdN_TaX5Cf0bqiBjdRlN2XyGFXfg9RHVow";
const API_BASE = "http://localhost:3001/api/v1";
const TEST_USER_ID = "82a3e9d9-8589-4b01-970a-62956ad843cc";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getTestToken() {
  const { data: userData } =
    await supabase.auth.admin.getUserById(TEST_USER_ID);
  if (!userData?.user?.email) throw new Error("User not found");

  const { data: linkData, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: userData.user.email,
    });

  if (linkError) throw linkError;

  const token = linkData.properties.hashed_token;
  const { data: verifyData, error: verifyError } =
    await supabase.auth.verifyOtp({
      token_hash: token,
      type: "magiclink",
    });

  if (verifyError) throw verifyError;
  return verifyData.session.access_token;
}

async function apiCall(method, endpoint, body = null, token) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (body && ["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, data, ok: response.ok };
}

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function logStep(step, msg) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`STEP ${step}: ${msg}`);
  console.log("=".repeat(60));
}

async function getTestData() {
  const { data: items } = await supabase
    .from("items")
    .select("id, item_code")
    .eq("is_active", true)
    .limit(1);
  const { data: partners } = await supabase
    .from("partners")
    .select("id, name")
    .eq("is_active", true)
    .limit(1);
  const { data: stocks } = await supabase
    .from("stocks")
    .select("id, item_id, quantity")
    .eq("is_active", true)
    .eq("status", "available")
    .limit(1);

  return {
    item: items?.[0],
    partner: partners?.[0],
    stock: stocks?.[0],
  };
}

async function countStocks() {
  const { data } = await supabase
    .from("stocks")
    .select("id, quantity")
    .eq("is_active", true);
  return data?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
}

async function getStockById(stockId) {
  const { data } = await supabase
    .from("stocks")
    .select("*")
    .eq("id", stockId)
    .single();
  return data;
}

async function getOrderHistory(orderId) {
  const { data } = await supabase
    .from("order_history")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at");
  return data;
}

async function runTests() {
  console.log("\n🧪 CHISAN Platform - Order Workflow E2E Test\n");
  console.log("=".repeat(60));

  // Get test token
  log("🔐", "Getting test authentication token...");
  const token = await getTestToken();
  log("✅", "Token obtained successfully");

  // Get test data
  const testData = await getTestData();
  log("📦", `Test item: ${testData.item?.item_code}`);
  log("🤝", `Test partner: ${testData.partner?.name}`);
  log(
    "📊",
    `Test stock ID: ${testData.stock?.id} (qty: ${testData.stock?.quantity})`,
  );

  const initialStockQty = await countStocks();
  log("📊", `Initial total stock quantity: ${initialStockQty}`);

  let results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  function assert(condition, testName, details = "") {
    if (condition) {
      results.passed++;
      results.tests.push({ name: testName, passed: true });
      log("✅", `PASS: ${testName}`);
    } else {
      results.failed++;
      results.tests.push({ name: testName, passed: false, details });
      log("❌", `FAIL: ${testName}${details ? " - " + details : ""}`);
    }
    return condition;
  }

  // ============================================================
  // TEST SCENARIO A: Stock-In Normal Flow
  // ============================================================
  logStep("A", "STOCK-IN NORMAL FLOW");

  // A1: Create stock-in order
  log("📝", "Creating stock-in order...");
  const createOrderRes = await apiCall(
    "POST",
    "/orders",
    {
      type: "stock_in",
      reason: "container",
      partnerId: testData.partner.id,
      scheduledDate: "2026-01-20",
      memo: "E2E Test - Stock In Order",
      items: [
        {
          itemId: testData.item.id,
          widthMm: 1000,
          requestedQty: 5,
          requestedWeightKg: 500,
        },
      ],
    },
    token,
  );

  assert(
    createOrderRes.ok,
    "A1: Create stock-in order",
    `Status: ${createOrderRes.status}`,
  );

  if (!createOrderRes.ok) {
    console.error("Create order failed:", createOrderRes.data);
    return;
  }

  const order = createOrderRes.data.order;
  const orderId = order.id;
  const orderItemId = order.items[0].id;

  log("📋", `Created order: ${order.orderNumber} (${order.status})`);
  assert(order.status === "pending", "A1b: Order status is pending");
  assert(
    order.orderNumber.startsWith("OI-"),
    "A1c: Order number format correct (OI-*)",
  );

  // A2: Start field processing
  log("🏭", "Starting field processing...");
  const startRes = await apiCall("POST", `/orders/${orderId}/start`, {}, token);
  assert(
    startRes.ok,
    "A2: Start field processing",
    `Status: ${startRes.status}`,
  );
  assert(
    startRes.data.order?.status === "field_processing",
    "A2b: Status changed to field_processing",
  );

  // A3: Complete field processing with different quantity
  log("✍️", "Completing field processing with processed qty=4 (partial)...");
  const processRes = await apiCall(
    "POST",
    `/orders/${orderId}/process`,
    {
      items: [
        {
          orderItemId: orderItemId,
          processedQty: 4, // Process less than requested (partial)
          processedWeightKg: 400,
        },
      ],
      memo: "Processed 4 of 5 requested",
    },
    token,
  );
  assert(
    processRes.ok,
    "A3: Complete field processing",
    `Status: ${processRes.status}`,
  );
  assert(
    processRes.data.order?.status === "awaiting_approval",
    "A3b: Status changed to awaiting_approval",
  );

  // A4: Approve order
  log("👍", "Approving order...");
  const approveRes = await apiCall(
    "POST",
    `/orders/${orderId}/approve`,
    {
      memo: "Approved - E2E Test",
    },
    token,
  );
  assert(approveRes.ok, "A4: Approve order", `Status: ${approveRes.status}`);
  assert(
    approveRes.data.order?.status === "approved",
    "A4b: Status changed to approved",
  );

  // A5: Verify stock was created
  log("🔍", "Verifying stock creation...");
  const newStockQty = await countStocks();
  log(
    "📊",
    `New total stock quantity: ${newStockQty} (was ${initialStockQty})`,
  );
  assert(
    newStockQty === initialStockQty + 4,
    "A5: Stock quantity increased by processed qty (4)",
    `Expected ${initialStockQty + 4}, got ${newStockQty}`,
  );

  // A6: Verify order history
  const history = await getOrderHistory(orderId);
  log("📜", `Order history has ${history?.length} entries`);
  const actions = history?.map((h) => h.action) ?? [];
  assert(actions.includes("created"), 'A6a: History has "created" action');
  assert(
    actions.includes("field_started"),
    'A6b: History has "field_started" action',
  );
  assert(
    actions.includes("field_completed"),
    'A6c: History has "field_completed" action',
  );
  assert(actions.includes("approved"), 'A6d: History has "approved" action');

  // ============================================================
  // TEST SCENARIO B: Stock-Out Normal Flow
  // ============================================================
  logStep("B", "STOCK-OUT NORMAL FLOW");

  // Get current stock for stock-out
  const stockBeforeOut = await getStockById(testData.stock.id);
  const stockQtyBefore = stockBeforeOut?.quantity ?? 0;
  log("📊", `Stock before out: ${stockQtyBefore}`);

  if (stockQtyBefore < 2) {
    log("⚠️", "Insufficient stock for stock-out test, skipping...");
  } else {
    // B1: Create stock-out order
    log("📝", "Creating stock-out order...");
    const createOutRes = await apiCall(
      "POST",
      "/orders",
      {
        type: "stock_out",
        reason: "sales",
        partnerId: testData.partner.id,
        memo: "E2E Test - Stock Out Order",
        items: [
          {
            itemId: testData.stock.item_id,
            stockId: testData.stock.id,
            widthMm: 500,
            requestedQty: 2,
          },
        ],
      },
      token,
    );

    assert(
      createOutRes.ok,
      "B1: Create stock-out order",
      `Status: ${createOutRes.status}`,
    );

    if (createOutRes.ok) {
      const outOrder = createOutRes.data.order;
      const outOrderId = outOrder.id;
      const outOrderItemId = outOrder.items[0].id;

      log("📋", `Created order: ${outOrder.orderNumber} (${outOrder.status})`);
      assert(
        outOrder.orderNumber.startsWith("OO-"),
        "B1b: Order number format correct (OO-*)",
      );

      // B2: Start field processing
      const startOutRes = await apiCall(
        "POST",
        `/orders/${outOrderId}/start`,
        {},
        token,
      );
      assert(startOutRes.ok, "B2: Start field processing");

      // B3: Complete field processing
      const processOutRes = await apiCall(
        "POST",
        `/orders/${outOrderId}/process`,
        {
          items: [
            {
              orderItemId: outOrderItemId,
              processedQty: 2,
            },
          ],
          memo: "Stock out processed",
        },
        token,
      );
      assert(processOutRes.ok, "B3: Complete field processing");

      // B4: Approve
      const approveOutRes = await apiCall(
        "POST",
        `/orders/${outOrderId}/approve`,
        {
          memo: "Approved stock out",
        },
        token,
      );
      assert(approveOutRes.ok, "B4: Approve stock-out order");

      // B5: Verify stock was decremented
      const stockAfterOut = await getStockById(testData.stock.id);
      log(
        "📊",
        `Stock after out: ${stockAfterOut?.quantity} (was ${stockQtyBefore})`,
      );
      assert(
        stockAfterOut?.quantity === stockQtyBefore - 2,
        "B5: Stock quantity decreased by 2",
        `Expected ${stockQtyBefore - 2}, got ${stockAfterOut?.quantity}`,
      );
    }
  }

  // ============================================================
  // TEST SCENARIO C: Rejection Flow
  // ============================================================
  logStep("C", "REJECTION FLOW");

  const stockBeforeReject = await countStocks();

  // C1: Create order for rejection
  const rejectOrderRes = await apiCall(
    "POST",
    "/orders",
    {
      type: "stock_in",
      reason: "domestic_purchase",
      memo: "E2E Test - To be rejected",
      items: [
        {
          itemId: testData.item.id,
          widthMm: 500,
          requestedQty: 10,
        },
      ],
    },
    token,
  );
  assert(rejectOrderRes.ok, "C1: Create order for rejection");

  if (rejectOrderRes.ok) {
    const rejectOrder = rejectOrderRes.data.order;
    const rejectOrderId = rejectOrder.id;
    const rejectOrderItemId = rejectOrder.items[0].id;

    // C2: Process to awaiting_approval
    await apiCall("POST", `/orders/${rejectOrderId}/start`, {}, token);
    await apiCall(
      "POST",
      `/orders/${rejectOrderId}/process`,
      {
        items: [{ orderItemId: rejectOrderItemId, processedQty: 10 }],
      },
      token,
    );

    // C3: Reject without memo (should fail)
    const rejectNoMemoRes = await apiCall(
      "POST",
      `/orders/${rejectOrderId}/reject`,
      {},
      token,
    );
    assert(
      !rejectNoMemoRes.ok,
      "C3: Reject without memo fails",
      `Status: ${rejectNoMemoRes.status}`,
    );

    // C4: Reject with memo
    const rejectRes = await apiCall(
      "POST",
      `/orders/${rejectOrderId}/reject`,
      {
        memo: "Rejected for testing purposes",
      },
      token,
    );
    assert(rejectRes.ok, "C4: Reject with memo succeeds");
    assert(
      rejectRes.data.order?.status === "rejected",
      "C4b: Status is rejected",
    );

    // C5: Verify no stock changes
    const stockAfterReject = await countStocks();
    assert(
      stockAfterReject === stockBeforeReject,
      "C5: No stock changes after rejection",
      `Expected ${stockBeforeReject}, got ${stockAfterReject}`,
    );
  }

  // ============================================================
  // TEST SCENARIO D: Urgent Approval Flow
  // ============================================================
  logStep("D", "URGENT APPROVAL FLOW");

  const stockBeforeUrgent = await countStocks();

  // D1: Create order for urgent approval
  const urgentOrderRes = await apiCall(
    "POST",
    "/orders",
    {
      type: "stock_in",
      reason: "container",
      memo: "E2E Test - Urgent order",
      items: [
        {
          itemId: testData.item.id,
          widthMm: 800,
          requestedQty: 3,
        },
      ],
    },
    token,
  );
  assert(urgentOrderRes.ok, "D1: Create order for urgent approval");

  if (urgentOrderRes.ok) {
    const urgentOrder = urgentOrderRes.data.order;
    const urgentOrderId = urgentOrder.id;
    const urgentOrderItemId = urgentOrder.items[0].id;

    // D2: Urgent approve (skips field processing)
    const urgentRes = await apiCall(
      "POST",
      `/orders/${urgentOrderId}/urgent`,
      {
        items: [{ orderItemId: urgentOrderItemId, processedQty: 3 }],
        memo: "Urgent approval - E2E test",
      },
      token,
    );
    assert(urgentRes.ok, "D2: Urgent approve succeeds");
    assert(
      urgentRes.data.order?.status === "approved",
      "D2b: Status is approved",
    );
    assert(
      urgentRes.data.order?.isUrgent === true,
      "D2c: isUrgent flag is true",
    );

    // D3: Verify stock changes applied
    const stockAfterUrgent = await countStocks();
    assert(
      stockAfterUrgent === stockBeforeUrgent + 3,
      "D3: Stock increased by urgent qty",
      `Expected ${stockBeforeUrgent + 3}, got ${stockAfterUrgent}`,
    );

    // D4: Verify history has urgent_approved action
    const urgentHistory = await getOrderHistory(urgentOrderId);
    const urgentActions = urgentHistory?.map((h) => h.action) ?? [];
    assert(
      urgentActions.includes("urgent_approved"),
      'D4: History has "urgent_approved" action',
    );
  }

  // ============================================================
  // TEST SCENARIO E: Edge Cases
  // ============================================================
  logStep("E", "EDGE CASES");

  // E1: Invalid reason for type
  const invalidReasonRes = await apiCall(
    "POST",
    "/orders",
    {
      type: "stock_in",
      reason: "sales", // sales is for stock_out only
      items: [{ itemId: testData.item.id, widthMm: 500, requestedQty: 1 }],
    },
    token,
  );
  assert(!invalidReasonRes.ok, "E1: Invalid reason for type fails");

  // E2: Insufficient stock for stock-out
  const insufficientRes = await apiCall(
    "POST",
    "/orders",
    {
      type: "stock_out",
      reason: "sales",
      items: [
        {
          itemId: testData.stock.item_id,
          stockId: testData.stock.id,
          widthMm: 500,
          requestedQty: 99999, // Way more than available
        },
      ],
    },
    token,
  );
  assert(!insufficientRes.ok, "E2: Insufficient stock fails");

  // ============================================================
  // Summary
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total:  ${results.passed + results.failed}`);
  console.log("=".repeat(60));

  if (results.failed > 0) {
    console.log("\nFailed tests:");
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`  - ${t.name}${t.details ? ": " + t.details : ""}`);
      });
  }

  console.log("\n✨ E2E Test Complete!\n");

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
