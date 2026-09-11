import assert from "node:assert/strict";
import {
  sumRupees, invoiceTotal, labourTotals, availableCredit, shopSaleAmounts,
  manualSalePrice, achievedMarginPct, shopTotals, invoiceDiscount, partnerSplit,
} from "../src/lib/accounting-core.ts";
let count = 0;
const check = (actual, expected, name) => { assert.deepEqual(actual, expected, name); count++; };

check(sumRupees([{ amount: 999999999999 }, { amount: 1 }]), 1000000000000n, "Whole rupees remain exact");
check(sumRupees(Array.from({ length: 10000 }, () => ({ amount: 999999999999 }))), 9999999999990000n, "All-time sums exceed JS safe integer without losing precision");
check(invoiceTotal([{ amount: 12500, quantity: 2 }, { amount: 4000, quantity: 3 }]), 37000n, "Invoice quantity multiplication");
check(invoiceTotal([]), 0n, "Empty calculation");
check(availableCredit(100000n, 7000n, 15000n), 78000n, "General and labour expenses both reduce Credit");
check(availableCredit(0n, 7000n, 0n), -7000n, "Negative Credit is visible");

// Manual pricing: margin onto the purchase price, then a percentage discount.
check(manualSalePrice(10000, 40, 0), { marked: 14000n, discount: 0n, salePrice: 14000n }, "Margin with no discount");
check(manualSalePrice(10000, 40, 5), { marked: 14000n, discount: 700n, salePrice: 13300n }, "5% off the marked price");
check(manualSalePrice(10000, 40, 100), { marked: 14000n, discount: 14000n, salePrice: 0n }, "A full discount gives the item away, not a negative price");
check(manualSalePrice(3333, 40, 0).marked, 4666n, "Half-rupee margin rounds to whole rupees, matching the SQL CHECK");
check(manualSalePrice(999999999999, 1000, 0).salePrice, 10999999999989n, "Largest price stays exact past the JS safe integer");

// A row's figures. Quantity multiplies both sides; a draft has unknown profit.
check(shopSaleAmounts({ quantity: 1, sale_price: 13300, cost: 10000 }), { quantity: 1n, unit: 13300n, sale: 13300n, cost: 10000n, profit: 3300n }, "Single unit");
check(shopSaleAmounts({ quantity: 6, sale_price: 7000, cost: 5000 }), { quantity: 6n, unit: 7000n, sale: 42000n, cost: 30000n, profit: 12000n }, "Quantity multiplies sale and cost");
check(shopSaleAmounts({ quantity: 2, sale_price: 7000, cost: null }).profit, null, "A draft row has unknown profit, not zero");
check(shopSaleAmounts({ quantity: 1, sale_price: 9000, cost: 10000 }).profit, -1000n, "Selling under cost is a real loss");

check(achievedMarginPct(13300n, 10000n), 33, "Margin is derived once the cost is known");
check(achievedMarginPct(13300n, null), null, "No cost, no margin");
check(achievedMarginPct(13300n, 0n), null, "Free stock has no margin to divide by");

const ledger = [
  { quantity: 1, sale_price: 13300, cost: 10000, returned_on: null },
  { quantity: 2, sale_price: 7000, cost: null, returned_on: null },
  { quantity: 1, sale_price: 7000, cost: 5000, returned_on: "2026-09-01" },
];
check(shopTotals(ledger), { sold: 2, sales: 27300n, profit: 3300n, drafts: 1, returned: 1, returnedSales: 7000n }, "Drafts count in sales but not profit; returns count in neither");
check(shopTotals([]), { sold: 0, sales: 0n, profit: 0n, drafts: 0, returned: 0, returnedSales: 0n }, "Empty ledger");

check(invoiceDiscount(14000n, 5), { discount: 700n, total: 13300n }, "Invoice discount is a percentage");
check(invoiceDiscount(14000n, 0), { discount: 0n, total: 14000n }, "No discount leaves the subtotal");
check(invoiceDiscount(999n, 50), { discount: 500n, total: 499n }, "Half a rupee rounds up, matching the SQL");

// Labour payslip, the owner's worked example.
const shift = { pay_basis: "monthly", salary: 45000, per_day_salary: 1730, days_worked: 0, item_count: 0, item_rate: 0, ot_hours: 12, ot_rate: 250, deduction: 500, leaves: 2, advance: 10000, salary_paid: 20000 };
check(labourTotals(shift), { regularPay: 45000n, leaveDeduction: 3460n, overtime: 3000n, total: 44040n, paid: 30000n, balance: 14040n }, "Salary plus overtime, less leave and other deductions");
check(labourTotals({ ...shift, leaves: 0, ot_hours: 0, deduction: 0 }).total, 45000n, "Bare salary when nothing is added or taken off");
check(labourTotals({ ...shift, salary: 1000, deduction: 5000, ot_hours: 0, leaves: 0 }).total, -4000n, "Over-deduction shows as negative rather than clamping to zero");
check(labourTotals({ ...shift, advance: 0, salary_paid: 0 }).balance, 44040n, "Nothing paid yet leaves the whole total owing");
check(labourTotals({ ...shift, pay_basis: "daily", salary: 0, days_worked: 24, per_day_salary: 1800, leaves: 0 }).regularPay, 43200n, "Daily worker pay is days worked times the daily rate");
check(labourTotals({ ...shift, pay_basis: "per_item", salary: 0, per_day_salary: 0, item_count: 18, item_rate: 900, leaves: 0 }).regularPay, 16200n, "Per-item worker pay is items completed times the item rate");

check(partnerSplit(11500n, 30n), { minor: 3450n, major: 8050n }, "30/70 split");
check(partnerSplit(11500n, 30n).minor + partnerSplit(11500n, 30n).major, 11500n, "The two shares always sum to the net");
check(partnerSplit(-1000n, 30n), { minor: -300n, major: -700n }, "A loss splits the same way");
check(partnerSplit(7n, 30n).minor + partnerSplit(7n, 30n).major, 7n, "Truncated rupees are not lost");

console.log(`accounting-check: ${count} assertions passed`);
