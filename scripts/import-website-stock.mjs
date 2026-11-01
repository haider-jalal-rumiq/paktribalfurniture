// Publishes the website stock photos as products, grouped by scripts/website-stock-products.json.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/import-website-stock.mjs
//       Dry run: checks the manifest, converts every photo, and writes nothing.
//
//   node --env-file=.env.local --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/import-website-stock.mjs --apply
//       Uploads the photos to the product-images bucket and inserts the products as published.
//
// Applying needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The service role key
// bypasses row level security, so this runs only from a trusted machine. A product whose slug
// already exists is skipped, so running --apply again only adds what is missing.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { categories } from "../src/content/catalog.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "scripts/website-stock-products.json");
const PHOTO_DIR = path.join(ROOT, "public/images/website-stock");
const BUCKET = "product-images";
const MAX_EDGE = 1400;
const MAX_PHOTOS_PER_PRODUCT = 12;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const categorySlugs = new Set(categories.map((category) => category.slug));
const apply = process.argv.includes("--apply");

/** Mirrors productInputSchema in src/features/studio/product.schema.ts. */
function problemsWith(entry) {
  const problems = [];
  if (!SLUG_PATTERN.test(entry.slug)) problems.push("slug must be lowercase words joined by hyphens");
  if (entry.name.trim().length < 2 || entry.name.length > 140) problems.push("name must be 2 to 140 characters");
  if (!categorySlugs.has(entry.categorySlug)) problems.push(`unknown category "${entry.categorySlug}"`);
  if (entry.shortDescription.trim().length < 10 || entry.shortDescription.length > 220) problems.push("short description must be 10 to 220 characters");
  if (entry.images.length < 1 || entry.images.length > MAX_PHOTOS_PER_PRODUCT) problems.push(`needs 1 to ${MAX_PHOTOS_PER_PRODUCT} photos`);
  if (entry.dimensions !== undefined && entry.dimensions.length > 160) problems.push("dimensions must be 160 characters or fewer");
  return problems;
}

/** Each photo should appear in exactly one product, so nothing is published twice by accident. */
function photoUsageProblems(products, photoNames) {
  const used = products.flatMap((product) => product.images);
  const counts = new Map();
  for (const name of used) counts.set(name, (counts.get(name) ?? 0) + 1);
  const problems = [];
  for (const [name, count] of counts) if (count > 1) problems.push(`${name} is used by ${count} products`);
  for (const name of used) if (!photoNames.has(name)) problems.push(`${name} is not in ${path.relative(ROOT, PHOTO_DIR)}`);
  for (const name of photoNames) if (!counts.has(name)) problems.push(`${name} is not used by any product`);
  return problems;
}

async function convertPhoto(fileName) {
  const source = path.join(PHOTO_DIR, fileName);
  const webp = await sharp(source, { limitInputPixels: false })
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return webp;
}

async function publish(products, converted) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for example with --env-file=.env.local).");
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: existing, error: lookupError } = await supabase.from("products").select("slug").in("slug", products.map((product) => product.slug));
  if (lookupError) {
    console.error("Could not read existing products", { code: lookupError.code, message: lookupError.message });
    process.exit(1);
  }
  const taken = new Set((existing ?? []).map((row) => row.slug));

  let created = 0, skipped = 0, failed = 0;
  for (const product of products) {
    if (taken.has(product.slug)) { skipped++; console.log(`skip   ${product.slug} (already in the database)`); continue; }

    const imageUrls = [];
    let uploadFailed = false;
    for (const [index, fileName] of product.images.entries()) {
      const storagePath = `website-stock/${product.slug}-${index + 1}.webp`;
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, converted.get(fileName), { contentType: "image/webp", upsert: false });
      if (error) {
        console.error("Could not upload photo", { slug: product.slug, file: fileName, message: error.message });
        uploadFailed = true;
        break;
      }
      imageUrls.push(supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl);
    }
    if (uploadFailed) { failed++; continue; }

    const { error } = await supabase.from("products").insert({
      name: product.name,
      slug: product.slug,
      category_slug: product.categorySlug,
      short_description: product.shortDescription,
      description: "",
      wood_types: [],
      dimensions: product.dimensions ?? null,
      price_note: null,
      image_urls: imageUrls,
      featured: false,
      published: true,
    });
    if (error) {
      console.error("Could not insert product", { slug: product.slug, code: error.code, message: error.message });
      failed++;
      continue;
    }
    created++;
    console.log(`added  ${product.slug} (${imageUrls.length} photo${imageUrls.length === 1 ? "" : "s"})`);
  }
  console.log(`\nDone: ${created} added, ${skipped} skipped, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

async function main() {
  const products = JSON.parse(await readFile(MANIFEST, "utf8"));
  const photoNames = new Set((await readdir(PHOTO_DIR)).filter((name) => /\.png$/i.test(name)));

  const problems = products.flatMap((product) => problemsWith(product).map((problem) => `${product.slug || product.name}: ${problem}`));
  const slugs = products.map((product) => product.slug);
  for (const slug of new Set(slugs)) if (slugs.indexOf(slug) !== slugs.lastIndexOf(slug)) problems.push(`${slug}: slug appears more than once`);
  problems.push(...photoUsageProblems(products, photoNames));
  if (problems.length) {
    console.error("The manifest has problems:\n" + problems.map((problem) => `  - ${problem}`).join("\n"));
    process.exit(1);
  }

  const converted = new Map();
  let bytes = 0;
  for (const product of products) {
    for (const fileName of product.images) {
      if (!converted.has(fileName)) {
        const webp = await convertPhoto(fileName);
        converted.set(fileName, webp);
        bytes += webp.length;
      }
    }
  }

  for (const product of products) {
    const sizeKb = Math.round(product.images.reduce((sum, fileName) => sum + converted.get(fileName).length, 0) / 1024);
    console.log(`${product.categorySlug.padEnd(38)} ${product.name} · ${product.images.length} photo${product.images.length === 1 ? "" : "s"} · ${sizeKb} KB`);
  }
  console.log(`\n${products.length} products, ${converted.size} photos converted to WebP, ${Math.round(bytes / 1024)} KB in total.`);

  if (!apply) {
    console.log("\nDry run: nothing was uploaded or inserted. Run again with --apply to publish.");
    return;
  }
  await publish(products, converted);
}

main().catch((error) => {
  console.error("Import stopped:", error instanceof Error ? error.message : error);
  process.exit(1);
});
