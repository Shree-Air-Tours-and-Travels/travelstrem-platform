import { useNavigate } from "react-router-dom";
import ProfileHeader from "../../components/profilePage/profileHeader";
import { usePortalConfig } from "../../components/portal/PortalConfigContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { session } = usePortalConfig();
  const user = session?.user || null;

  return   <ProfileHeader user= {user} navigate={navigate} />
};

export default ProfilePage;
