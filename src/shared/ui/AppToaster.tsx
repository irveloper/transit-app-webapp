"use client";

import { Toaster } from "sileo";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      offset={{ top: 20, right: 20 }}
      theme="light"
      options={{
        roundness: 28,
        duration: 4200,
        autopilot: { expand: 24, collapse: 20 },
      }}
    />
  );
}
