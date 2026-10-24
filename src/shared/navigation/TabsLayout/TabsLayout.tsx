import { Outlet, useLocation, useNavigate } from "react-router";
import AppShell from "../../components/AppShell/AppShell";
import TabBar from "../../components/ui/TabBar/TabBar";
import { useMainTabs } from "../mainTabs/mainTabs";
import { tabFromPathname, tabPaths } from "../routes/routes";

function TabsLayout() {
  const tabItems = useMainTabs();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = tabFromPathname(pathname);

  return (
    <AppShell
      id="app__shell--root"
      screenKey={activeTab}
      tabBar={
        <TabBar
          id="app__tabbar--main"
          items={tabItems}
          activeKey={activeTab}
          onSelect={(key) => navigate(tabPaths[key])}
        />
      }
    >
      <Outlet />
    </AppShell>
  );
}

export default TabsLayout;
