// Backward-compatible facade. New application code imports email.service.js.
import { sendTransactionalEmail } from "../../services/email.service.js";

export default { sendMail: sendTransactionalEmail };
