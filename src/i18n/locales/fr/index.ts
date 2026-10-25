import astrology from "./astrology.json";
import auth from "./auth.json";
import chart from "./chart.json";
import chat from "./chat.json";
import common from "./common.json";
import discovery from "./discovery.json";
import onboarding from "./onboarding.json";
import today from "./today.json";
import ui from "./ui.json";
import welcome from "./welcome.json";

export const fr = { common, welcome, auth, ui, astrology, onboarding, discovery, chart, chat, today };

export type Translations = typeof fr;
