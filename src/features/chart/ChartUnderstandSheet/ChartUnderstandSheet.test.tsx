import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ChartUnderstandSheet from "./ChartUnderstandSheet";

describe("ChartUnderstandSheet", () => {
  it("ne rend rien tant qu'elle est fermée", () => {
    render(<ChartUnderstandSheet idPrefix="t" open={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explique le thème de façon non catégorique et se ferme", async () => {
    const onClose = vi.fn();
    render(<ChartUnderstandSheet idPrefix="t" open onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Comprendre mon thème" })).toBeInTheDocument();
    for (const id of ["bigThree", "planets", "signs", "houses", "aspects", "limits"]) {
      expect(document.getElementById("t__section--understand-" + id)).toBeInTheDocument();
    }
    expect(document.getElementById("t__text--understand-conclusion")).toHaveTextContent("Rien n'est écrit d'avance");
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
