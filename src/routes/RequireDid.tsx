import { Navigate, Outlet, useLocation } from "react-router-dom";

export const RequireDid = () => {
  const location = useLocation();
  const did = localStorage.getItem("pv_did");

  if (!did) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireDid;


