export interface QuestionProvider {
  answer(question: string): Promise<string>;
}

// Le fournisseur IA réel arrive avec #26 : en attendant, une réponse fixe permet de faire
// tourner le parcours complet (quota compris) sans clé ni appel externe.
export const stubProvider: QuestionProvider = {
  answer: () =>
    Promise.resolve(
      "Les lectures personnalisées arrivent bientôt. Votre question a bien été reçue.",
    ),
};
