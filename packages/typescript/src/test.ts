import { GroundControlClient } from ".";

async function main() {
  const client = new GroundControlClient({
    apiKey: "gcp_OI6OuWvrObE2vwcn6aUMSP6jB07h1Y3Rfnax",
    baseURL: "http://127.0.0.1:8787",
    projectId: "P0ISNEXDQYHABFKG",
  });

  setInterval(async () => {
    const isEnabled = await client.isFeatureFlagEnabled("csv-export", "actor5");
    console.log("isEnabled:", isEnabled);
  }, 300);
}

main();
