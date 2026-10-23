import type { ReactElement } from "react";

export const iconPaths = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  "chevron-down": <path d="M5 9l7 7 7-7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </>
  ),
  send: <path d="M5 12h13M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M5 19h4L19 9l-4-4L5 15v4zM13.5 6.5l4 4" />,
  warning: (
    <>
      <path d="M12 4l9 16H3l9-16z" />
      <path d="M12 10v4M12 17v.01" />
    </>
  ),
  today: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </>
  ),
  consult: <path d="M5 6h14v9H10l-4 3v-3H5z" />,
  theme: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v5M12 15v5M4 12h5M15 12h5" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
    </>
  ),
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />,
  history: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
      <path d="M12 8v4l3 2" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof iconPaths;

export const iconNames = Object.keys(iconPaths) as IconName[];
