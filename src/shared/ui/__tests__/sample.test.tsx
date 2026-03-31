import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("sample smoke test", () => {
  it("renders a basic React element", () => {
    render(<p>Hello CI</p>);
    expect(screen.getByText("Hello CI")).toBeDefined();
  });
});
