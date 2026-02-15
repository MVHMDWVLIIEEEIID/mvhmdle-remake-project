import { Routes, Route } from "react-router";
import Menu from "./pages/Menu";
import Lost from "./pages/Lost";
import Setting from "./pages/Setting";
import Daily from "./pages/Daily";
import Survival from "./pages/Survival";
import MobileBlocker from "./components/MobileBlocker"; // Import

export default function App() {
  return (
    <MobileBlocker>
      <Routes>
        <Route index element={<Menu />} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/survival" element={<Survival />} />
        <Route path="/Setting" element={<Setting />} />
        <Route path="*" element={<Lost />} />
      </Routes>
    </MobileBlocker>
  );
}
