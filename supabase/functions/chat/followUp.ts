export type FollowUp = "ask" | "ask-domain" | "close" | "none";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const CLOSING = /^(merci|ok|d'accord|super|parfait|top|génial|cool|très bien|au revoir)\b/i;
const FACTUAL = /^(quel(le)?s? (est|sont)|c'est quoi|quand|combien|en quel)\b/i;
const VAGUE = /\b(parle-moi|dis-moi|ma vie)/i;
const OPEN_TOPIC =
  /\b(déménag|quitter|changer de|démission|décision|décider|hésit|peur|inquiet|perdu|stress|angoiss|rupture|séparation)/i;
const SHORT_MESSAGE_WORDS = 4;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function decideFollowUp(question: string, history: Turn[]): FollowUp {
  const text = question.trim();
  const answers = history.filter((turn) => turn.role === "assistant");
  const lastAnswer = answers[answers.length - 1];
  if (CLOSING.test(text) && wordCount(text) <= SHORT_MESSAGE_WORDS) return "close";
  if (lastAnswer && /\?\s*$/.test(lastAnswer.content.trim())) return "none";
  if (FACTUAL.test(text)) return "none";
  if (VAGUE.test(text) || wordCount(text) <= SHORT_MESSAGE_WORDS) return "ask-domain";
  if (OPEN_TOPIC.test(text)) return "ask";
  return answers.length % 2 === 1 ? "ask" : "none";
}

const MUST_END_WITH_QUESTION =
  "Consigne pour cette réponse (obligatoire) : la dernière phrase de ta réponse doit être UNE courte question ouverte, qui se termine par un point d'interrogation";

const INSTRUCTIONS: Record<FollowUp, string> = {
  ask:
    `${MUST_END_WITH_QUESTION}, en lien avec ce que la personne vient de dire (jamais une demande d'information personnelle).`,
  "ask-domain":
    `${MUST_END_WITH_QUESTION}, qui demande sur quel domaine la personne souhaite avancer (par exemple le travail, les relations, l'énergie ou la personnalité).`,
  close:
    "Consigne pour cette réponse : la personne conclut ou remercie ; réponds en deux ou trois phrases chaleureuses, sans question et sans nouvelle analyse.",
  none: "Consigne pour cette réponse : ne pose aucune question ; termine par une phrase affirmative.",
};

export function followUpInstruction(question: string, history: Turn[]): string {
  return INSTRUCTIONS[decideFollowUp(question, history)];
}
