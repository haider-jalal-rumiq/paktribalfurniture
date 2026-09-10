import { saveLabour } from "@/lib/labour-write";
export async function POST(request: Request) { return saveLabour(request); }
