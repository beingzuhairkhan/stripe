import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51S9MFdSYVQa5aNM19XCcYcTbyOoXtiHVlONx49ahFguJmKkPTj1ebIxd3JggJkRqLzMVONeAvuzAqRFyr8L4mHth001FWiKntx");

export default function CreateCheckout() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 500, currency: "usd" }), 
      });
      const data = await res.json();
      if (!data.id) throw new Error("No session id received");

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) {
        console.error("Stripe redirect error:", error);
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create checkout session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p>Click button to pay $5.00</p>
      <button onClick={handleCheckout} disabled={loading}>
        {loading ? "Creating..." : "Pay $5.00"}
      </button>
    </div>
  );
}
