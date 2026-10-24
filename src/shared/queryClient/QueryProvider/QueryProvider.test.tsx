import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryProvider } from "./QueryProvider";

function Probe() {
  const client = useQueryClient();
  return <p id="query-provider-test__text--probe">{String(client.getDefaultOptions().queries?.staleTime)}</p>;
}

describe("QueryProvider", () => {
  it("fournit un QueryClient configuré aux enfants", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );

    expect(screen.getByText("30000")).toBeInTheDocument();
  });
});
