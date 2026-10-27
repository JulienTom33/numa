import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnswerBasis } from "../answerBasis/answerBasis";
import ChatAnswerBasis from "./ChatAnswerBasis";

const basis: AnswerBasis = {
  confidence: "medium",
  houseSystem: "placidus",
  bodies: [
    { body: "sun", sign: "leo", degreeInSign: 12.3, retrograde: false, house: 5 },
    { body: "mercury", sign: "virgo", degreeInSign: 3, retrograde: true, house: null },
  ],
  ascendant: { sign: "scorpio", degreeInSign: 20 },
  midheaven: { sign: "leo", degreeInSign: 1.5 },
  aspects: [{ bodyA: "sun", bodyB: "moon", type: "square", orb: 2.1 }],
  warnings: ["approximate_time"],
};

describe("ChatAnswerBasis", () => {
  it("liste positions, aspects, glossaire, fiabilité et avertissements", () => {
    render(<ChatAnswerBasis messageId="m2" basis={basis} />);

    expect(document.getElementById("chat-answer-basis__section--m2-body--sun")).toHaveTextContent(
      "Soleil en Lion, à 12,3° du signe, maison 5",
    );
    expect(document.getElementById("chat-answer-basis__section--m2-body--mercury")).toHaveTextContent(
      "Mercure en Vierge, à 3° du signe, rétrograde",
    );
    expect(screen.getByText(/Ascendant en Scorpion/)).toBeInTheDocument();
    expect(screen.getByText(/Milieu du ciel en Lion/)).toBeInTheDocument();
    expect(screen.getByText(/Soleil et Lune en carré \(écart de 2,1°\)/)).toBeInTheDocument();
    expect(screen.getByText(/Le degré situe l'astre/)).toBeInTheDocument();
    expect(document.getElementById("chat-answer-basis__section--m2-aspect--sun-moon-square")).toBeInTheDocument();
    expect(screen.getByText("Maisons calculées avec le système Placidus.")).toBeInTheDocument();
    expect(document.getElementById("chat-answer-basis__section--m2-glossary--retrograde")).toHaveTextContent(
      "l'astre semble reculer dans le ciel, vu de la Terre",
    );
    expect(document.getElementById("chat-answer-basis__section--m2-glossary--houseSystem")).toHaveTextContent(
      "Système de maisons",
    );
    expect(screen.getByText(/Les deux astres peuvent entrer en tension/)).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("Fiabilité du calcul : moyenne.")).toBeInTheDocument();
    expect(screen.getByText(/heure de naissance est approximative/)).toBeInTheDocument();
  });

  it("signale les données non disponibles", () => {
    render(
      <ChatAnswerBasis
        messageId="m2"
        basis={{ ...basis, ascendant: null, midheaven: null, houseSystem: null, aspects: [], warnings: [] }}
      />,
    );

    expect(screen.getByText(/Ascendant et Milieu du ciel : non disponibles/)).toBeInTheDocument();
    expect(screen.getByText("Maisons : non disponibles pour ce thème.")).toBeInTheDocument();
    expect(screen.getByText("Aucun aspect n'a été retenu pour cette réponse.")).toBeInTheDocument();
    expect(screen.queryByText("Points d'incertitude")).not.toBeInTheDocument();
  });

  it("indique l'absence de thème", () => {
    render(<ChatAnswerBasis messageId="m2" basis={null} />);
    expect(screen.getByText(/Aucun thème natal n'était disponible/)).toBeInTheDocument();
  });
});
