// utils/auth.ts
export const saveAuthData = (token: string, user: object) => {
  localStorage.setItem("jwt", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const getAuthToken = () => {
  return localStorage.getItem("jwt");
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const removeAuthData = () => {
  localStorage.removeItem("jwt");
  localStorage.removeItem("user");
};
