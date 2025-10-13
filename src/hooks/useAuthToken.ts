import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthToken = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);

  const loadAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      setAuthToken(token);
    } catch (error) {
      console.error("Failed to load auth token:", error);
    }
  };

  const saveAuthToken = async (token: string) => {
    try {
      await AsyncStorage.setItem("auth_token", token);
      setAuthToken(token);
      console.log("Auth token saved to AsyncStorage");
    } catch (error) {
      console.error("Failed to save auth token:", error);
    }
  };

  useEffect(() => {
    loadAuthToken();
  }, []);

  return { authToken, saveAuthToken };
};
