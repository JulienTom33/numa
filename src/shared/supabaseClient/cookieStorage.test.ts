import { afterEach, describe, expect, it } from "vitest";
import { cookieStorage, readCookie } from "./cookieStorage";

afterEach(() => {
  document.cookie.split("; ").forEach((part) => {
    const name = part.split("=")[0];
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
  window.localStorage.clear();
});

describe("cookieStorage", () => {
  it("stores, reads and removes a value", () => {
    expect(cookieStorage.getItem("sb-test-auth-token")).toBeNull();

    cookieStorage.setItem("sb-test-auth-token", '{"a":1}');
    expect(cookieStorage.getItem("sb-test-auth-token")).toBe('{"a":1}');

    cookieStorage.removeItem("sb-test-auth-token");
    expect(cookieStorage.getItem("sb-test-auth-token")).toBeNull();
    expect(document.cookie).toBe("");
  });

  it("handles keys with reserved characters", () => {
    cookieStorage.setItem("sidera:pending-conversion", "anon-1");

    expect(cookieStorage.getItem("sidera:pending-conversion")).toBe("anon-1");
  });

  it("splits values that exceed the cookie size limit and rebuilds them", () => {
    const value = JSON.stringify({ token: "é".repeat(5000) });

    cookieStorage.setItem("sb-test-auth-token", value);

    expect(document.cookie.split("; ").length).toBeGreaterThan(1);
    document.cookie.split("; ").forEach((part) => expect(part.length).toBeLessThan(4000));
    expect(cookieStorage.getItem("sb-test-auth-token")).toBe(value);
  });

  it("removes obsolete chunks when the value shrinks", () => {
    cookieStorage.setItem("sb-test-auth-token", "x".repeat(8000));
    cookieStorage.setItem("sb-test-auth-token", "short");

    expect(cookieStorage.getItem("sb-test-auth-token")).toBe("short");
    expect(readCookie("sb-test-auth-token.0")).toBeNull();
  });

  it("migrates a legacy localStorage value to a cookie and purges it", () => {
    window.localStorage.setItem("sb-test-auth-token", "legacy");

    expect(cookieStorage.getItem("sb-test-auth-token")).toBe("legacy");

    expect(window.localStorage.getItem("sb-test-auth-token")).toBeNull();
    expect(readCookie("sb-test-auth-token")).toBe("legacy");
  });
});
