import "server-only";

/** Fetch every page so exports and grouped orders never stop at the API row limit. */
export async function readAll<T>(
  read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code: string; message: string } | null }>,
): Promise<T[] | null> {
  const rows: T[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await read(offset, offset + pageSize - 1);
    if (error) {
      console.error("Could not load CMS records", { code: error.code, message: error.message });
      return null;
    }
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}
