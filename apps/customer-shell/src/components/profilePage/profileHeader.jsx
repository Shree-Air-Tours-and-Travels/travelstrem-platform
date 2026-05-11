import React from 'react';

const ProfileHeader = ({user,loading, navigate}) => {
      console.log(user, loading, "safsdfsdf");
    return (
        <div className="profile-header">
         <h1>Welcome, {user?.name}!</h1>
              <p>Email: {user?.email}</p>
              <button onClick={() => navigate("/")}>Logout</button>
        </div>
    );
};

export default ProfileHeader;