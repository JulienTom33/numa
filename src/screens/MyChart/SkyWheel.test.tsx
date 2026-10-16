import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SkyWheel from "./SkyWheel";
import { completeNatal, unknownTimeNatal } from "./myChartFixtures";

vi.mock("../../lib/supabaseClient", () => ({ supabase: {} }));

describe("SkyWheel", () => {
  it("expose une image nommée et décrite, avec maisons et Ascendant", () => {
    render(<SkyWheel id="wheel" {...completeNatal} />);

    const image = screen.getByRole("img", { name: /Carte du ciel de naissance/ });
    expect(image).toHaveAccessibleDescription(/12 maisons/);
    expect(document.querySelectorAll("[id^='wheel-sign--']")).toHaveLength(12);
    expect(document.querySelectorAll("[id^='wheel-house--']")).toHaveLength(12);
    expect(document.querySelectorAll("[id^='wheel-body--']")).toHaveLength(10);
    expect(document.getElementById("wheel-ascendant-label")).toBeInTheDocument();
  });

  it("sans heure : roue sans cuspides ni Ascendant, description adaptée", () => {
    render(<SkyWheel id="wheel" {...unknownTimeNatal} bodies={unknownTimeNatal.bodies} />);

    expect(screen.getByRole("img")).toHaveAccessibleDescription(/sans maisons/);
    expect(document.getElementById("wheel-houses")).toBeNull();
    expect(document.getElementById("wheel-ascendant-label")).toBeNull();
    expect(document.querySelectorAll("[id^='wheel-body--']")).toHaveLength(10);
  });

  it("place l'Ascendant à gauche : la cuspide 1 est horizontale à gauche", () => {
    render(<SkyWheel id="wheel" {...completeNatal} />);

    const line = document.querySelector("#wheel-house--1 line") as SVGLineElement;
    expect(Number(line.getAttribute("y1"))).toBeCloseTo(170);
    expect(Number(line.getAttribute("x2"))).toBeLessThan(170);
  });
});
