import { type ReactNode, useEffect, useRef } from "react";

interface Props {
  id: string;
  screenKey: string;
  children: ReactNode;
  tabBar?: ReactNode;
}

function AppShell({ id, screenKey, children, tabBar }: Props) {
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [screenKey]);

  return (
    <div id={id} className="flex h-dvh justify-center overflow-hidden bg-page text-ink">
      <div className="flex h-full w-full max-w-shell flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <main
          ref={scrollRef}
          id={`${id}-content`}
          className="flex-1 overflow-y-auto pt-[env(safe-area-inset-top)]"
        >
          {children}
        </main>
        {tabBar ?? <div aria-hidden="true" className="pb-[env(safe-area-inset-bottom)]" />}
      </div>
    </div>
  );
}

export default AppShell;
