const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validatePhone = (phone) => {
  const re = /^(\+62|62|0)[0-9]{9,12}$/;
  return !phone || re.test(phone.replace(/[\s-]/g, ""));
};

const validateNIK = (nik) => {
  return !nik || (nik.length === 16 && /^\d+$/.test(nik));
};

const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input.trim().replace(/[<>]/g, "");
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateNIK,
  sanitizeInput,
};
