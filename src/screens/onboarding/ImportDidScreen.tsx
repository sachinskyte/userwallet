import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const ImportDidScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login - DID must come from MetaMask
    navigate("/login", { replace: true });
  }, [navigate]);

  return null;
};

export default ImportDidScreen;


