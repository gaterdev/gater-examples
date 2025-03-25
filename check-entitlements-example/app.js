import axios from "axios";
import "dotenv/config";

async function main() {
  const gater = axios.create({
    baseURL: "https://api.gater.dev",
    headers: { "X-Api-Key": process.env.GATER_SECRET }, // public key also OK for check requests
  });

  const response = await gater.get("/check", {
    params: { user: "user_123", feature: "app_tokens" },
  });

  console.log(response.data);
}

main().catch((error) => console.error(error));
