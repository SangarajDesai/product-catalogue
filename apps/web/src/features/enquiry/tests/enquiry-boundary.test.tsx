import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "../../../app/app";

vi.mock("../components/enquiry-form", () => ({
  EnquiryForm: () => { throw new Error("Controlled enquiry rendering failure"); },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("leaves product details visible when opening the enquiry form fails to render", async () => {
  const category = { slug: "bags", name: "Bags" };
  vi.stubGlobal("fetch", vi.fn(async (path: string) => Response.json(path === "/api/categories" ? [category] : {
    id: 1,
    title: "Trail backpack",
    category,
    price: { amount: 109.95, currency: "INR" },
    imageUrl: "/api/products/1/image",
    description: "A backpack with a padded sleeve.",
  })));

  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/products/1"]}><App /></MemoryRouter>
    </QueryClientProvider>,
    { onCaughtError: () => undefined },
  );

  fireEvent.click(await screen.findByRole("button", { name: "Enquire" }));
  expect(screen.getByRole("alert").textContent).toBe("Could not display the enquiry form.");
  expect(screen.getByRole("heading", { name: "Trail backpack" })).toBeTruthy();
  expect(screen.getByText("A backpack with a padded sleeve.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.getByRole("button", { name: "Enquire" })).toBeTruthy();
});
