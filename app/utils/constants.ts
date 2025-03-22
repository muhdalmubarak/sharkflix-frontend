export interface User {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    AFFCode?: string;
  }

export const USER_ROLES = {
  ADMIN: "admin",
  CREATOR: "creator",
  AFFILIATE: "affiliate",
};

export const CURRENT_USER = (): User | null => {
  // Check if we're running on the client side
  if (typeof window !== 'undefined') {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  // Return null if we're on the server side
  return null;
};
