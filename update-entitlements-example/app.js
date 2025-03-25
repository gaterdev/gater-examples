import axios from "axios";
import "dotenv/config";

async function main() {
  const gater = axios.create({
    baseURL: "https://api.gater.dev",
    headers: { "X-Api-Key": process.env.GATER_SECRET },
  });

  const response = await gater.post("/increment", {
    user: "user_123",
    feature: "app_tokens",
    amount: 5000, // ⚠️ defaults to 1 if undefined
  });

  console.log(response.data);
}

main().catch((error) => console.error(error));
