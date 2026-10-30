import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BirthDateFields from "./BirthDateFields";

const TODAY = new Date(2026, 9, 24);

describe("BirthDateFields", () => {
  it("propose jour, mois et année et remonte les changements", async () => {
    const onChange = vi.fn();
    render(
      <BirthDateFields
        id="date"
        value={{ day: 12, month: 3, year: 1990 }}
        onChange={onChange}
        today={TODAY}
      />,
    );

    expect(screen.getByLabelText("Mois")).toHaveValue("3");
    await userEvent.selectOptions(screen.getByLabelText("Année"), "1985");
    expect(onChange).toHaveBeenCalledWith({ day: 12, month: 3, year: 1985 });
  });

  it("ne propose aucune année rendant l'utilisateur plus jeune que 15 ans", () => {
    render(<BirthDateFields id="date" value={{ day: null, month: null, year: null }} onChange={vi.fn()} today={TODAY} />);
    const years = Array.from(screen.getByLabelText("Année").querySelectorAll("option")).map((option) => option.value);
    expect(years).toContain("2011");
    expect(years).not.toContain("2012");
  });

  it("affiche l'erreur", () => {
    render(
      <BirthDateFields id="date" value={{ day: null, month: null, year: null }} onChange={vi.fn()} error="Date invalide" today={TODAY} />,
    );
    expect(screen.getByText("Date invalide")).toBeInTheDocument();
  });
});
