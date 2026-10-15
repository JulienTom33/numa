import { type IconName, iconPaths } from "./icons";

interface Props {
  name: IconName;
  size?: number;
  className?: string;
}

function Icon({ name, size = 20, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {iconPaths[name]}
    </svg>
  );
}

export default Icon;
