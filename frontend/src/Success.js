import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("checking");
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("no-session");
      return;
    }

  fetch(`http://localhost:8000/payment-status?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        console.log("Frontend data" ,data)
        if (data.error) {
          setStatus("not-found");
        } else {
          setStatus(data.status);
          setPayment(data.payment);
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [sessionId]);

  return (
    <div>
      <h3>Payment Return</h3>
      <p>Session: {sessionId || "—"}</p>
      <p>Status: {status}</p>
      {payment && (
        <div style={{ marginTop: 10 }}>
          <strong>Payment record:</strong>
          <pre>{JSON.stringify(payment, null, 2)}</pre>
        </div>
      )}
      <p>
        If status is still <code>pending</code>, wait a few seconds for webhook to process, then refresh.
      </p>
    </div>
  );
}
