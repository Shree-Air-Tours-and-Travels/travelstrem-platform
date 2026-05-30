export default class ApiError extends Error {
  constructor(statusCode = 500, message = "Internal Server Error", details = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.status = statusCode;
    this.details = details;
  }
}

