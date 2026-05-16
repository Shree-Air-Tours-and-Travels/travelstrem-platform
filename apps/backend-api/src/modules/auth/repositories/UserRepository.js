import User from "../models/User.js";

const UserRepository = {
  findByEmail(email) {
    return User.findOne({ email });
  },
  findById(id, projection) {
    const query = User.findById(id);
    return projection ? query.select(projection) : query;
  },
  findForPasswordReset(email, otp) {
    return User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });
  },
  create(payload) {
    return new User(payload);
  },
};

export default UserRepository;
