import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { FeatureErrorBoundary } from "../feature-error-boundary";

afterEach(cleanup);

it("can recover a feature after a render error while leaving its sibling visible", () => {
  let shouldFail = true;

  function Feature() {
    if (shouldFail) throw new Error("Example render failure");
    return <p>Feature is ready.</p>;
  }

  render(
    <>
      <h1>Page shell</h1>
      <FeatureErrorBoundary message="Feature is unavailable.">
        <Feature />
      </FeatureErrorBoundary>
    </>,
    { onCaughtError: () => {} },
  );

  expect(screen.getByRole("heading", { name: "Page shell" })).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Feature is unavailable.");
  shouldFail = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.getByText("Feature is ready.")).toBeTruthy();
});
