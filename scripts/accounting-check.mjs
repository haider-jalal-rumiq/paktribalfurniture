import assert from "node:assert/strict";
import { sumRupees, invoiceTotal, labourAmounts, availableCredit, shopSaleAmounts, shopTotals, partnerSplit } from "../src/lib/accounting-core.ts";
let count = 0;
const check = (actual, expected, name) => { assert.deepEqual(actual, expected, name); count++; };
check(sumRupees([{ amount: 999999999999 }, { amount: 1 }]), 1000000000000n, "Whole rupees remain exact");
check(sumRupees(Array.from({ length: 10000 }, () => ({ amount: 999999999999 }))), 9999999999990000n, "All-time sums exceed JS safe integer without losing precision");
check(invoiceTotal([{ amount: 12500, quantity: 2 }, { amount: 4000, quantity: 3 }]), 37000n, "Invoice quantity multiplication");
check(invoiceTotal([]), 0n, "Empty calculation");
check(labourAmounts({ total_amount: 38000, advance: 10000, salary_paid: 5000 }), { paid: 15000n, balance: 23000n }, "Labour balance excludes already-paid advance");
check(labourAmounts({ total_amount: 100, advance: 50, salary_paid: 50 }).balance, 0n, "Fully paid labour");
check(availableCredit(100000n, 7000n, 15000n), 78000n, "General and labour expenses both reduce Credit");
check(availableCredit(0n, 7000n, 0n), -7000n, "Negative Credit is visible");
// Shop counter sale: the owner's worked example, cost 10,000 at 40% less Rs 500.
check(shopSaleAmounts({ cost: 10000, margin_pct: 40, discount: 500 }), { cost: 10000n, marked: 14000n, discount: 500n, sale: 13500n, profit: 3500n }, "Margin then discount, profit over cost");
check(shopSaleAmounts({ cost: 10000, margin_pct: 40, discount: 0 }).profit, 4000n, "No discount keeps the whole margin");
check(shopSaleAmounts({ cost: 10000, margin_pct: 40, discount: 4500 }).profit, -500n, "A discount past the margin is a real loss, not zero");
check(shopSaleAmounts({ cost: 3333, margin_pct: 40, discount: 0 }).marked, 4666n, "Half-rupee margin rounds to whole rupees, matching the SQL CHECK");
check(shopSaleAmounts({ cost: 999999999999, margin_pct: 1000, discount: 0 }).sale, 10999999999989n, "Largest sale stays exact past the JS safe integer");

const ledger = [
  { cost: 10000, margin_pct: 40, discount: 500, returned_on: null },
  { cost: 20000, margin_pct: 40, discount: 0, returned_on: null },
  { cost: 5000, margin_pct: 40, discount: 0, returned_on: "2026-09-01" },
];
check(shopTotals(ledger), { sold: 2, sales: 41500n, profit: 11500n, returned: 1, returnedSales: 7000n }, "A returned item leaves both sales and profit");

check(partnerSplit(11500n, 30n), { minor: 3450n, major: 8050n }, "30/70 split");
check(partnerSplit(11500n, 30n).minor + partnerSplit(11500n, 30n).major, 11500n, "The two shares always sum to the net");
check(partnerSplit(-1000n, 30n), { minor: -300n, major: -700n }, "A loss splits the same way");
check(partnerSplit(7n, 30n).minor + partnerSplit(7n, 30n).major, 7n, "Truncated rupees are not lost");

console.log(`accounting-check: ${count} assertions passed`);
