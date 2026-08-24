import React from "react";
import ProfilePage from "./ProfilePage.view";

export default function SettingsPage(props) {
  return (
    <ProfilePage
      {...props}
      title="Account settings"
      subtitle="Update profile details, avatar and password from one secure place."
      portalLabel="Partner"
    />
  );
}
