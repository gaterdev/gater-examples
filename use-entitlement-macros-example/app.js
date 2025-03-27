import axios from "axios";
import "dotenv/config";

async function main() {
  const gater = axios.create({
    baseURL: "https://api.gater.dev",
    headers: { "X-Api-Key": process.env.GATER_SECRET },
  });

  await gater.post("/macros", {
    name: "price_123ABC",
    feature: "app_tokens",
    quota: 1000000,
    reset: "month",
  });

  const response = await gater.post("/set", {
    user: "user_123",
    macro: "price_123ABC",
  });

  console.log(response.data);
}

main().catch((error) => console.error(error));
