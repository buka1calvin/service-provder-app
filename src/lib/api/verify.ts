/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import toast from "react-hot-toast";
import compareCloudinaryImages from "./ai/compare"

export interface UserInfo {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
    nationalId: string;
    phone: string;
    email: string;
    currentAddress: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    isActive?: boolean;
    motherDigitalId?: string;
    fatherDigitalId?: string;
    registrationDate?: string;
    lastUpdated?: string;
    securityLevel?: string;
  
    passwordHash?:string
  }
  
  export interface ApiResponse {
    success: boolean;
    message: string;
    accessToken?: string;
    userInfo?: UserInfo;
    digitalId?: string;
    tokenExpiry?: string;
    loginHistory?: Array<{
      timestamp: string;
      ipAddress: string;
      userAgent: string;
    }>;
  }
  
  export interface RegistrationData {
    method: "biometric" | "image" | "both";
    biometricData?: string;
    imageUrl?: string;
    userInfo: UserInfo;
  }
  
  export interface VerificationData {
    accessToken: string;
  }
  
export const apiService = {
  registerUser: async (formData: RegistrationData): Promise<ApiResponse> => {
    try {
      const response = await axios.post<ApiResponse>(
        `${(import.meta as any).env.VITE_CANISTER_ORIGIN}/biometric/register`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response;

      if (data.success && data.accessToken) {
        // Store token data in localStorage
        const tokenData = btoa(
          JSON.stringify({
            accessToken: data.accessToken,
            digitalId: data.digitalId,
            userInfo: data.userInfo,
            biometricData:data,
            timestamp: new Date().getTime(),
            tokenExpiry: data.tokenExpiry,
          })
        );

        localStorage.setItem("biometricAuthToken", tokenData);
        toast.success(data.message || "Registration successful");
      }

      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";
      toast.error(errorMessage);
      throw error;
    }
  },

  // Verify user token
  verifyToken: async (tokenData: VerificationData): Promise<ApiResponse> => {
    try {
      const response = await axios.post<ApiResponse>(
        `${(import.meta as any).env.VITE_CANISTER_ORIGIN}/biometric/verify`,
        tokenData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response;

      if (data.success) {
        toast.success(data.message || "Token verified successfully");
      }

      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Token verification failed";
      toast.error(errorMessage);
      throw error;
    }
  },

  // Get user profile with token
  getUserProfile: async (token: string): Promise<ApiResponse> => {
    try {
      const response = await axios.get<ApiResponse>(`${(import.meta as any).env.VITE_CANISTER_ORIGIN}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const { data } = response;
      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch profile";
      toast.error(errorMessage);
      throw error;
    }
  },
  loginUser: async (loginData: any): Promise<ApiResponse> => {
    try {
      const response = await axios.post<ApiResponse>(
        `${(import.meta as any).env.VITE_CANISTER_ORIGIN}/auth/login`,
        loginData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response;

      if (data.success) {
        toast.success(data.message || "Login successful");
      }

      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(errorMessage);
      throw error;
    }
  },
  loginWithDigitalId: async (digitalId: string): Promise<ApiResponse> => {
    try {
      const response = await axios.post<ApiResponse>(
        `${(import.meta as any).env.VITE_CANISTER_ORIGIN}/auth/login`,
        { digitalId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      const { data } = response;
  
      if (data.success) {
        toast.success(data.message || "Digital ID verified");
      }
  
      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(errorMessage);
      throw error;
    }
  },
  completeLogin: async (loginData: any): Promise<ApiResponse> => {
    try {
      const response = await axios.post<ApiResponse>(
        `${(import.meta as any).env.VITE_CANISTER_ORIGIN}/biometric/complete-login`,
        loginData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      const { data } = response;
  
      if (data.success && data.accessToken) {
        // Store token data in localStorage (same structure as signup)
        const tokenData = btoa(
          JSON.stringify({
            accessToken: data.accessToken,
            digitalId: data.digitalId,
            userInfo: data.userInfo,
            biometricData: data,
            timestamp: new Date().getTime(),
            tokenExpiry: data.tokenExpiry,
          })
        );
  
        localStorage.setItem("biometricAuthToken", tokenData);
        toast.success(data.message || "Login completed successfully");
      }
  
      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Complete login failed";
      toast.error(errorMessage);
      throw error;
    }
  },
  compareImages: async (storedImageUrl: string, uploadedImageUrl: string): Promise<boolean> => {
    try {
      return await compareCloudinaryImages(storedImageUrl, uploadedImageUrl);
    } catch (error) {
      console.error("Image comparison error:", error);
      return false;
    }
  },

  verifyBiometric: async (verificationData: any, token: string): Promise<ApiResponse> => {
    try {
      const response = await axios.post<ApiResponse>(
        `${(import.meta as any).env.VITE_CANISTER_ORIGIN}/biometric/verify`,
        verificationData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const { data } = response;
  
      if (data.success && data.accessToken) {
        // Store the token using the same structure as signup and completeLogin
        const tokenData = btoa(
          JSON.stringify({
            accessToken: data.accessToken,
            digitalId: data.digitalId,
            userInfo: data.userInfo,
            biometricData: data,
            timestamp: new Date().getTime(),
            tokenExpiry: data.tokenExpiry,
          })
        );
        
        localStorage.setItem("biometricAuthToken", tokenData);
        toast.success(data.message || "Biometric verification successful");
      }
  
      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Biometric verification failed";
      toast.error(errorMessage);
      throw error;
    }
  },

  // Logout user
  logoutUser: async (token: string): Promise<ApiResponse> => {
    try {
      const response = await axios.post<ApiResponse>(
        `${(import.meta as any).env.VITE_CANISTER_ORIGIN}/biometric/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response;

      if (data.success) {
        localStorage.removeItem("biometricAuthToken");
        toast.success(data.message || "Logged out successfully");
      }

      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Logout failed";
      toast.error(errorMessage);
      throw error;
    }
  },
};

// Utility functions
export const getStoredUserData = () => {
  const tokenData = localStorage.getItem("biometricAuthToken");
  if (!tokenData) return null;

  try {
    return JSON.parse(atob(tokenData));
  } catch (error) {
    console.error("Error parsing stored user data:", error);
    return null;
  }
};


export const clearStoredUserData = () => {
  localStorage.removeItem("biometricAuthToken");
};
