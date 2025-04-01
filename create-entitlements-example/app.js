import axios from "axios";
import "dotenv/config";

async function main() {
  const gater = axios.create({
    baseURL: "https://api.gater.dev",
    headers: { "X-Api-Key": process.env.GATER_SECRET },
  });

  const macro = "plan_123";

  await gater.post("/macros", {
    name: macro,
    feature: "app_tokens",
    quota: 1000000,
    reset: "month",
  });

  const response = await gater.post("/set", {
    user: "user_123",
    macro,
  });

  console.log(response.data);
}

main().catch((error) => console.error(error));
