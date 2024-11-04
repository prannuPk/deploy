import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const router = useNavigate();

    const isAuthenticated = () => {
      return !!localStorage.getItem("token"); // Simplified check for token presence
    };

    useEffect(() => {
      if (!isAuthenticated()) {
        router("/auth");
      }
    }, [router]); // Added router to the dependency array to prevent potential stale closure issues

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
