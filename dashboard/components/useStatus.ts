import { useState } from "react";

export function useStatus() {
  const [message, setMessage] = useState("");

  return {
    message,
    show: setMessage,
  };
}
