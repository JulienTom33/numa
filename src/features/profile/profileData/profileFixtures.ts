import type { ProfileData } from "./profileData";

export const authenticatedProfile: ProfileData = {
  userId: "user-1",
  firstName: "Camille",
  status: "authenticated",
  language: "fr",
  tone: "balanced",
  birth: {
    id: "birth-1",
    birthDate: "1990-03-12",
    birthTime: { precision: "exact", time: "14:30", margin: null },
    birthPlace: { label: "Lyon, France", latitude: 45.764043, longitude: 4.835659, timezone: "Europe/Paris" },
  },
};

export const anonymousProfile: ProfileData = { ...authenticatedProfile, status: "anonymous" };
