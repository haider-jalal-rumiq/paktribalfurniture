import "server-only";
import { labourInputSchema } from "@/features/cms/accounting.schema";
import { orNull } from "@/features/cms/fields";
import { labourTotals } from "@/lib/accounting-core";
import { getCmsSession } from "@/lib/cms";

export async function saveLabour(request: Request, id?: string) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  const parsed = labourInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  const v = parsed.data;
  if (id && id !== v.id) return Response.json({ message: "Check the labour entry." }, { status: 400 });
  // Total is computed here and nowhere else, from the same function the sheet
  // displays, so the stored figure can never disagree with the inputs beside it.
  const inputs = { pay_basis: v.payBasis, salary: v.salary, per_day_salary: v.perDaySalary,
    days_worked: v.daysWorked, item_count: v.itemCount, item_rate: v.itemRate,
    ot_hours: v.otHours, ot_rate: v.otRate, deduction: v.deduction, leaves: v.leaves,
    advance: v.advance, salary_paid: v.salaryPaid };
  const record = { name: v.name, period: `${v.period}-01`, paid_on: v.paidOn, ...inputs,
    total_amount: Number(labourTotals(inputs).total), notes: orNull(v.notes) };
  const { data, error } = id
    ? await session.supabase.from("labour_entries").update(record).eq("id", id).select("id").maybeSingle()
    : await session.supabase.from("labour_entries").upsert({ id: v.id, ...record }, { onConflict: "id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (error) {
    console.error("Could not save labour", { code: error.code, message: error.message });
    return Response.json({ message: "The labour entry could not be saved." }, { status: 400 });
  }
  if (id && !data) return Response.json({ message: "Labour entry not found." }, { status: 404 });
  return Response.json({ id: v.id }, { status: id ? 200 : 201 });
}
