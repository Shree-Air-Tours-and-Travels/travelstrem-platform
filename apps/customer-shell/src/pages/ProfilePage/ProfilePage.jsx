import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../redux/userSlice";
import ProfileHeader from "../../components/profilePage/profileHeader";

const ProfilePage = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.user);
  console.log(user, loading, "safsdf");
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  return   <ProfileHeader user= {user} navigate={navigate} />
};

export default ProfilePage;
