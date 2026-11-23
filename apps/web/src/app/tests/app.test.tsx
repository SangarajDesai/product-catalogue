import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { App } from "../app";

afterEach(cleanup);

it("shows a route fallback with a way back to the catalogue", () => {
  render(
    <MemoryRouter initialEntries={["/unknown-page"]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Page not found" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Return to the catalogue" }).getAttribute("href")).toBe("/");
});
