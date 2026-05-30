import User from "../models/User.js";

const UserRepository = {
  findByEmail(email) {
    return User.findOne({ email });
  },
  findById(id, projection) {
    const query = User.findById(id);
    return projection ? query.select(projection) : query;
  },
  findOne(query = {}, projection) {
    const dbQuery = User.findOne(query);
    return projection ? dbQuery.select(projection) : dbQuery;
  },
  create(payload) {
    return new User(payload);
  },
  updateProfile(userId, updates) {
    return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  },
  updatePassword(userId, passwordHash) {
    return User.findByIdAndUpdate(userId, { passwordHash }, { new: true });
  },
};

export default UserRepository;
