import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/layout/AppLayout";
import { HomeScreen } from "@/screens/Home/HomeScreen";
import { UploadScreen } from "@/screens/Upload/UploadScreen";
import { CredentialsScreen } from "@/screens/Credentials/CredentialsScreen";
import { ShareScreen } from "@/screens/Share/ShareScreen";
import { RecoveryScreen } from "@/screens/Recovery/RecoveryScreen";
import { SettingsScreen } from "@/screens/Settings/SettingsScreen";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomeScreen />} />
          <Route path="upload" element={<UploadScreen />} />
          <Route path="credentials" element={<CredentialsScreen />} />
          <Route path="share" element={<ShareScreen />} />
          <Route path="recovery" element={<RecoveryScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
};

export default App;
