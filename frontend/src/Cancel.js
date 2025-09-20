import React from "react";
import { useSearchParams } from "react-router-dom";

export default function Cancel() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  return (
    <div>
      <h3>Payment Cancelled</h3>
      <p>Session: {sessionId || "—"}</p>
      <p>Your payment was cancelled or not completed.</p>
    </div>
  );
}
