export const getDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const emptyTraveler = () => ({
  travellerType: "adult",
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dob: "",
  email: "",
  phone: "",
  age: "",
  nationality: "",
  countryOfResidence: "",
  passport: "",
  passportIssueCountry: "",
  passportExpiryDate: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactNumber: "",
  dietaryPreferences: "",
  medicalConditions: "",
  wheelchairRequired: false,
  visaStatus: "",
});
