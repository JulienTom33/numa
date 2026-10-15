import astrology from "./astrology.json";
import auth from "./auth.json";
import common from "./common.json";
import ui from "./ui.json";
import welcome from "./welcome.json";

export const fr = { common, welcome, auth, ui, astrology };

export type Translations = typeof fr;
