export interface QuestionProvider {
  answer(question: string): Promise<string>;
}

export const stubProvider: QuestionProvider = {
  answer: () =>
    Promise.resolve(
      "Les lectures personnalisées arrivent bientôt. Votre question a bien été reçue.",
    ),
};
