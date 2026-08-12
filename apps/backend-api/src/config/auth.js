export default {
  "status": "success",
  "message": "auth json successfully fetched",
  "componentData": {
    "title": "Login",
    "description": "Join us ",
    "data": [],
    "structure": {
      "defaultRole": "member",
      "roles": [
        { "value": "member", "label": "Member" },
        { "value": "agent", "label": "Agent" },
        { "value": "admin", "label": "Admin" }
      ],
      "header": {
        "ariaLabel": "TravelsTREM authentication",
        "brand": {
          "name": "TravelsTREM",
          "tagline": "Tours · Reservations · Experiences · Management",
          "logoSrc": "/favicon.png",
          "darkLogoSrc": "/favicon-dark.png"
        },
        "themeAction": {
          "darkLabel": "Switch to dark mode",
          "lightLabel": "Switch to light mode",
          "darkIcon": "moon",
          "lightIcon": "sun"
        }
      },
      "company": {
        "eyebrow": "Travel, thoughtfully connected",
        "title": "One account for every journey.",
        "description": "Discover curated trips, manage reservations and keep every travel detail together with",
        "descriptionHighlight": "TravelsTREM, the travel platform by Shree Air Tours and Travels.",
        "highlights": [
          {
            "icon": "map",
            "title": "Curated experiences",
            "description": "Thoughtfully planned adventures and holiday packages."
          },
          {
            "icon": "calendar",
            "title": "Reservations in one place",
            "description": "Keep bookings, payments and travel details together."
          },
          {
            "icon": "support",
            "title": "Travel support",
            "description": "Helpful guidance from our Jaipur-based travel team."
          }
        ],
        "businessName": "Shree Air Tours and Travels",
        "location": "Jaipur, India"
      },
      "strings": {
        "signInWith": "Sign In",
        "signUpWith": "Sign Up",
        "or": "or:",
        "rememberMe": "Remember me",
        "forgotPassword": "Forgot password?",
        "loginButton": "Log In",
        "registerButton": "Register",
        "processing": "Processing...",
        "needAdminSecret": "Admin secret required to register as admin.",
        "missingLoginFields": "Email and password are required.",
        "missingRegisterFields": "Please fill name, email and password.",
        "passwordsMismatch": "Passwords do not match.",
        "placeholder": {
          "name": "Name",
          "email": "Email or username",
          "password": "Password",
          "confirmPassword": "Confirm Password",
          "adminSecret": "Admin Secret"
        },
        "forgotSuccess": "If that email exists, an email with reset instructions has been sent.",
        "forgotFail": "Could not send reset email (server error).",
        "sendOtp": "Send OTP",
        "verifyOtp": "Verify OTP",
        "newPassword": "New Password",
        "confirmNewPassword": "Confirm New Password",
        "notAMember": "Not a member?",
        "signUp": "Sign up",
        "alreadyAMember": "Already a member?"
      },
      "storageKeys": {}
    }
  },
  "config": {}
};
