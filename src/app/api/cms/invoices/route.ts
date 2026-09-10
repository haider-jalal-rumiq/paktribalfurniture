import { saveInvoice } from "@/lib/invoice-write";
export async function POST(request: Request) { return saveInvoice(request); }
