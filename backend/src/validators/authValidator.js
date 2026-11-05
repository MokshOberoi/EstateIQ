/**
 * Authentication Input Validators
 * Handcrafted input sanitization and validation adhering to project guidelines.
 */

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const validateRegister = (body) => {
  const errors = [];
  const { name, email, password, phone } = body || {};

  // Validate Name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters long.');
  } else if (name.trim().length > 150) {
    errors.push('Full name cannot exceed 150 characters.');
  }

  // Validate Email
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  // Validate Password (min 8 chars, at least 1 letter and 1 digit)
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.push('Password must contain at least one letter and one number.');
  }

  // Validate Phone (optional)
  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string' || phone.trim().length < 7 || phone.trim().length > 25) {
      errors.push('Phone number must be between 7 and 25 characters if provided.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: name ? name.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      password: password || '',
      phone: phone ? phone.trim() : null,
    },
  };
};

const validateLogin = (body) => {
  const errors = [];
  const { email, password } = body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      email: email ? email.trim().toLowerCase() : '',
      password: password || '',
    },
  };
};

const validateRefresh = (body) => {
  const errors = [];
  const { refreshToken } = body || {};

  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
    errors.push('Refresh token is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      refreshToken: refreshToken ? refreshToken.trim() : '',
    },
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRefresh,
};

