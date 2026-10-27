import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { readCookieConsent } from "../cookieConsent";
import CookieConsentProvider from "../CookieConsentProvider";
import CookieBanner from "./CookieBanner";

function clearCookies() {
  document.cookie.split("; ").forEach((part) => {
    const name = part.split("=")[0];
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
}

function renderBanner() {
  return render(
    <CookieConsentProvider>
      <CookieBanner />
    </CookieConsentProvider>,
  );
}

afterEach(clearCookies);

describe("CookieBanner", () => {
  it("is shown on first visit with both choices", () => {
    renderBanner();

    expect(screen.getByRole("button", { name: "Accepter" })).toHaveAttribute("id", "cookie-banner__button--accept");
    expect(screen.getByRole("button", { name: "Refuser" })).toHaveAttribute("id", "cookie-banner__button--refuse");
  });

  it("disappears and remembers an acceptance", async () => {
    renderBanner();

    await userEvent.click(screen.getByRole("button", { name: "Accepter" }));

    expect(screen.queryByRole("button", { name: "Accepter" })).not.toBeInTheDocument();
    expect(readCookieConsent()).toBe("accepted");
  });

  it("disappears and remembers a refusal", async () => {
    renderBanner();

    await userEvent.click(screen.getByRole("button", { name: "Refuser" }));

    expect(screen.queryByRole("button", { name: "Refuser" })).not.toBeInTheDocument();
    expect(readCookieConsent()).toBe("refused");
  });

  it("stays hidden when a choice already exists", () => {
    document.cookie = "sidera-cookie-consent=refused; Path=/";

    renderBanner();

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accepter" })).not.toBeInTheDocument();
  });

  it("is operable with the keyboard", async () => {
    renderBanner();

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Refuser" })).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    expect(readCookieConsent()).toBe("accepted");
  });
});
