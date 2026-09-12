import { saveWoodEntry } from "@/lib/wood-write";

export async function POST(request: Request) {
  return saveWoodEntry(request);
}
