import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const did = localStorage.getItem("pv_did");
    if (did) {
      navigate("/", { replace: true });
    } else {
      // Redirect to login - DID must come from MetaMask
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
};

export default WelcomeScreen;


