import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProductEnquiry } from "../product-enquiry";

function openEnquiry() {
  render(<QueryClientProvider client={new QueryClient()}><ProductEnquiry productId={1} /></QueryClientProvider>);
  expect(screen.queryByRole("form", { name: "Product enquiry" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Enquire" }));
}

function fillContact() {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Example Shopper  " } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "shopper@example.test" } });
  fireEvent.change(screen.getByLabelText("Message (optional)"), { target: { value: "  Is this available?  " } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("validates required contact details before making a request", () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  openEnquiry();
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  " } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "invalid" } });
  fireEvent.click(screen.getByRole("button", { name: "Send enquiry" }));

  expect(screen.getByText("Enter your name.")).toBeTruthy();
  expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});

it("prevents duplicate pending submissions and confirms an empty 204 response", async () => {
  let respond: (response: Response) => void = () => { throw new Error("No pending request"); };
  const pending = new Promise<Response>((resolve) => { respond = resolve; });
  const fetch = vi.fn(() => pending);
  vi.stubGlobal("fetch", fetch);
  openEnquiry();
  fillContact();

  const form = screen.getByRole("form", { name: "Product enquiry" });
  act(() => {
    fireEvent.submit(form);
    fireEvent.submit(form);
  });

  expect((await screen.findByRole("button", { name: "Sending…" })).matches(":disabled")).toBe(true);
  expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/products/1/enquiries", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ name: "Example Shopper", email: "shopper@example.test", message: "Is this available?" }),
  }));
  respond(new Response(null, { status: 204 }));

  expect((await screen.findByRole("status")).textContent).toMatch(/^Thank you/);
  expect(screen.queryByRole("form", { name: "Product enquiry" })).toBeNull();
});

it("keeps entered data after a 503 and sends again only when the shopper retries", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ error: {
      code: "MAIL_UNAVAILABLE", message: "Could not send the enquiry. Try again.", requestId: "mail-request",
    } }, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetch);
  openEnquiry();
  fillContact();
  fireEvent.click(screen.getByRole("button", { name: "Send enquiry" }));

  expect((await screen.findByRole("alert")).textContent).toContain("Could not send the enquiry. Try again.");
  expect(screen.getByText("Request ID: mail-request")).toBeTruthy();
  expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe("  Example Shopper  ");
  expect(screen.getByLabelText<HTMLInputElement>("Email address").value).toBe("shopper@example.test");
  expect(screen.getByLabelText<HTMLTextAreaElement>("Message (optional)").value).toBe("  Is this available?  ");
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect((await screen.findByRole("status")).textContent).toMatch(/^Thank you/);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0]).toEqual(fetch.mock.calls[1]);
});

it("omits a blank message and treats an unexpected success status as recoverable", async () => {
  const fetch = vi.fn(async () => Response.json({ accepted: true }, { headers: { "X-Request-Id": "wrong-status" } }));
  vi.stubGlobal("fetch", fetch);
  openEnquiry();
  fillContact();
  fireEvent.change(screen.getByLabelText("Message (optional)"), { target: { value: "  " } });
  fireEvent.click(screen.getByRole("button", { name: "Send enquiry" }));

  expect((await screen.findByRole("alert")).textContent).toContain("The API returned an invalid response.");
  expect(screen.getByText("Request ID: wrong-status")).toBeTruthy();
  expect(fetch).toHaveBeenCalledWith("/api/products/1/enquiries", expect.objectContaining({
    body: JSON.stringify({ name: "Example Shopper", email: "shopper@example.test" }),
  }));
});
