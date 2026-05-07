import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "../api/userApi";

const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const { data } = await getProfile(token);
        dispatch({ type: "user/loginSuccess", payload: data }); // ✅ Correct action
      } catch {
        dispatch({ type: "user/logoutSuccess" });
      }
    };

    if (!user) fetchUser();
  }, [dispatch, user]);

  return user;
};

export default useAuth;
