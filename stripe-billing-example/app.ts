import "dotenv/config";
import axios, { AxiosInstance } from "axios";
import { Stripe } from "stripe";
import express, { Request, Response } from "express";
const app = express();

app.post(
  "/stripe/webhooks",
  express.raw({ type: "application/json" }),
  (request: Request, response: Response) => {
    const stripe = new Stripe(process.env.STRIPE_API_KEY as string);
    const sig = request.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    const gater = axios.create({
      baseURL: "https://api.gater.dev",
      headers: { "X-Api-Key": process.env.GATER_SECRET },
    });

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
        handleSubscriptionCreated(event.data.object, gater);
        break;
      case "customer.subscription.deleted":
        handleSubscriptionCanceled(event.data.object, gater);
        break;
      case "invoice.upcoming":
        handleUpcomingInvoice(event.data.object, gater, stripe);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  gater: AxiosInstance
) {
  const user = subscription.metadata.user_id; // assuming you attached this during checkout
  const plan = subscription.items.data[0].plan.id;

  let payload;

  if (plan === "price_ABC123") {
    payload = { user, feature: "tokens", quota: 10000, reset: "month" };
  } else if (plan === "price_DEF456") {
    payload = { user, feature: "tokens", quota: 1000, reset: "month" };
  } else {
    throw new Error("no entitlement exists for the given plan");
  }

  await gater.post("/set", payload);
}

async function handleSubscriptionCanceled(
  subscription: Stripe.Subscription,
  gater: AxiosInstance
) {
  const user = subscription.metadata.user_id;

  const payload = { user, feature: "tokens", quota: 0, reset: "never" };

  await gater.post("/set", payload);
}

async function handleUpcomingInvoice(
  invoice: Stripe.Invoice,
  gater: AxiosInstance,
  stripe: Stripe
) {
  const user = invoice.metadata!.user_id;
  const customerId = invoice.customer as string;

  const params = { user, feature: "tokens" };
  const meter = "api_tokens"; // Stripe meter event name

  const entitlement = await gater.get("/check", { params });

  const usage = entitlement.data.usage as number;

  // Send meter event to Stripe
  await stripe.billing.meterEvents.create({
    event_name: meter,
    payload: {
      stripe_customer_id: customerId,
      value: usage.toString(),
    },
  });
}

app.listen(4242, () => console.log("Running on port 4242"));
