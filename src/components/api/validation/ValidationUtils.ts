
export const validateApiId = (value: string): string => {
  if (!value.trim()) {
    return "API ID is required";
  }
  
  const apiId = parseInt(value, 10);
  if (isNaN(apiId) || apiId <= 0) {
    return "API ID must be a positive number";
  }
  
  return "";
};

export const validateApiHash = (value: string): string => {
  if (!value.trim()) {
    return "API Hash is required";
  }
  
  if (value.length < 5) {
    return "API Hash is too short";
  }
  
  return "";
};

export const validatePhoneNumber = (value: string): string => {
  if (!value.trim()) {
    return "Phone number is required";
  }
  
  if (!/^\+[0-9]{7,15}$/.test(value)) {
    return "Invalid phone number format (e.g. +1234567890)";
  }
  
  return "";
};

export const getErrorMessage = (field: string, value: string): string => {
  switch (field) {
    case 'apiKey':
      return validateApiId(value);
    case 'apiHash':
      return validateApiHash(value);
    case 'phoneNumber':
      return validatePhoneNumber(value);
    default:
      return "";
  }
};

export const isFormValid = (account: {
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
  nickname: string;
}): boolean => {
  return !validateApiId(account.apiKey) &&
         !validateApiHash(account.apiHash) &&
         !validatePhoneNumber(account.phoneNumber) &&
         !!account.nickname;
};
