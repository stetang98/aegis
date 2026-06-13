/**
 * Day-1 spike C0 — locate MedPsy in the QVAC model registry.
 * Result (2026-06-13): MedPsy is NOT in the registry (801 entries; med/psy matches are all
 * MedGemma). → load MedPsy from Hugging Face GGUF instead. Kept as a reproducible probe.
 */
import { modelRegistryList, modelRegistrySearch, type ModelRegistryEntry } from "@qvac/sdk";

async function main(): Promise<void> {
  let list: ModelRegistryEntry[] = [];
  try {
    list = await modelRegistryList();
    console.log(`modelRegistryList(): ${list.length} entries`);
  } catch (e: unknown) {
    console.error("modelRegistryList failed:", e);
  }

  const matches = list.filter((m: ModelRegistryEntry) => /med|psy/i.test(m.name));
  console.log(`\nmed/psy name matches: ${matches.length}`);
  for (const m of matches) {
    console.log(` - ${m.name} | source=${m.registrySource} | path=${m.registryPath}`);
  }

  console.log("\nsample of registry names:", list.slice(0, 20).map((m: ModelRegistryEntry) => m.name).join(", "));

  try {
    const searched = await modelRegistrySearch();
    console.log(`\nmodelRegistrySearch(): ${searched.length} entries`);
  } catch (e: unknown) {
    console.error("modelRegistrySearch failed:", e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
