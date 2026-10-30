import astrology from "./astrology.json";
import auth from "./auth.json";
import chart from "./chart.json";
import chartDetail from "./chartDetail.json";
import chat from "./chat.json";
import common from "./common.json";
import cookies from "./cookies.json";
import discovery from "./discovery.json";
import history from "./history.json";
import horoscope from "./horoscope.json";
import legal from "./legal.json";
import onboarding from "./onboarding.json";
import profile from "./profile.json";
import today from "./today.json";
import ui from "./ui.json";
import welcome from "./welcome.json";

export const fr = { common, welcome, auth, ui, astrology, onboarding, discovery, chart, chartDetail, chat, history, legal, profile, today, cookies, horoscope };

export type Translations = typeof fr;
