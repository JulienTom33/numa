import { cx } from "../../../lib/cx";
import Icon from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import { focusRing } from "../styles";

export interface TabBarItem<K extends string> {
  key: K;
  label: string;
  icon: IconName;
}

interface Props<K extends string> {
  id: string;
  items: TabBarItem<K>[];
  activeKey: K;
  onSelect: (key: K) => void;
  label?: string;
}

const activeClasses = "bg-violet-soft text-violet-ink";
const inactiveClasses = "text-ink-secondary hover:text-ink";

function TabBar<K extends string>({
  id,
  items,
  activeKey,
  onSelect,
  label = "Navigation principale",
}: Props<K>) {
  return (
    <nav
      id={id}
      aria-label={label}
      className="border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16 max-w-app items-center justify-around px-2">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key}>
              <button
                id={`${id}-${item.key}`}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onSelect(item.key)}
                className={cx(
                  "relative flex min-w-[72px] flex-col items-center gap-0.5 rounded-button px-3 py-1.5 transition-colors",
                  focusRing,
                  active ? activeClasses : inactiveClasses,
                )}
              >
                <Icon name={item.icon} size={22} />
                <span className="font-display text-tab font-semibold">{item.label}</span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 h-1 w-1 rounded-full bg-gold"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default TabBar;
