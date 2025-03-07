import Joi from "joi";

export const validateRegistration = (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required().trim().messages({
      "string.base": "Username must be a string",
      "string.empty": "Username cannot be empty",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username cannot exceed 30 characters",
      "any.required": "Username is required",
    }),
    email: Joi.string().email().required().trim().messages({
      "string.base": "Email must be a string",
      "string.empty": "Email cannot be empty",
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(8).max(64).required().messages({
      "string.base": "Password must be a string",
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 64 characters",
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data, { abortEarly: false }); // Return all validation errors
};

export const validateLogin = (data: { email: string; password: string }) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().messages({
      "string.base": "Email must be a string",
      "string.empty": "Email cannot be empty",
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(8).max(64).required().messages({
      "string.base": "Password must be a string",
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 64 characters",
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data, { abortEarly: false }); // Return all validation errors
};
