import ContactLead from "../models/ContactLead.js";

const ContactLeadRepository = {
  create(payload) {
    return new ContactLead(payload);
  },
  find(query = {}) {
    return ContactLead.find(query);
  },
  findOne(query = {}) {
    return ContactLead.findOne(query);
  },
};

export default ContactLeadRepository;
