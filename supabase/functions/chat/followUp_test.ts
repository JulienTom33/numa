import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { decideFollowUp, followUpInstruction } from "./followUp.ts";

const answer = (content: string) => ({ role: "assistant" as const, content });
const ask = (content: string) => ({ role: "user" as const, content });

Deno.test("a vague question gets a question about the domain", () => {
  assertEquals(decideFollowUp("Parle-moi de ma vie", []), "ask-domain");
  assertEquals(decideFollowUp("Mon avenir ?", []), "ask-domain");
});

Deno.test("a decision or worry gets a follow-up question", () => {
  assertEquals(decideFollowUp("Je pense à déménager à l'étranger, qu'en penses-tu ?", []), "ask");
  assertEquals(decideFollowUp("J'hésite à quitter mon poste en ce moment", []), "ask");
});

Deno.test("a factual question never gets a follow-up", () => {
  assertEquals(decideFollowUp("Quel est mon signe solaire ?", []), "none");
  assertEquals(decideFollowUp("Quelle est ma planète dominante ?", []), "none");
});

Deno.test("thanks and closings get a short reply without a question", () => {
  assertEquals(decideFollowUp("Merci beaucoup", [ask("Q"), answer("Une réponse.")]), "close");
  assertEquals(decideFollowUp("ok parfait", [ask("Q"), answer("Qu'en pensez-vous ?")]), "close");
});

Deno.test("no follow-up right after an answer that ended with a question", () => {
  const history = [ask("Q"), answer("Une réponse. Qu'est-ce qui vous pèse le plus ?")];
  assertEquals(decideFollowUp("Surtout le travail, je me sens perdu", history), "none");
  assertEquals(decideFollowUp("Parle-moi de mes relations", history), "none");
  assertEquals(decideFollowUp("Merci", history), "close");
});

Deno.test("ordinary questions alternate between answers with and without a follow-up", () => {
  const first = decideFollowUp("Comment se présente ma semaine sur le plan professionnel ?", []);
  const second = decideFollowUp("Comment se présente ma semaine sur le plan amoureux ?", [
    ask("Q1"),
    answer("Réponse sans question."),
  ]);
  const third = decideFollowUp("Comment se présente ma semaine sur le plan familial ?", [
    ask("Q1"),
    answer("Réponse sans question."),
    ask("Q2"),
    answer("Réponse sans question."),
  ]);
  assertEquals([first, second, third], ["none", "ask", "none"]);
});

Deno.test("the instruction text matches the decision", () => {
  assertStringIncludes(followUpInstruction("Parle-moi de ma vie", []), "sur quel domaine");
  assertStringIncludes(
    followUpInstruction("J'hésite à quitter mon poste en ce moment", []),
    "UNE courte question",
  );
  assertStringIncludes(followUpInstruction("Merci", []), "sans question");
  assertStringIncludes(
    followUpInstruction("Quel est mon signe solaire ?", []),
    "ne pose aucune question",
  );
  assertStringIncludes(
    followUpInstruction("J'hésite à quitter mon poste en ce moment", []),
    "jamais une demande d'information personnelle",
  );
});
