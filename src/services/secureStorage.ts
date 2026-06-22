import * as Keychain from "react-native-keychain";

const TOKEN_KEY = "auth_token";

export const saveToken = async (token: string) => {
  try {
    await Keychain.setGenericPassword(
      TOKEN_KEY,
      token,
      {
        service: TOKEN_KEY,
        accessible:
          Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      }
    );
  } catch (error) {
    console.log("Save Token Error:", error);
  }
};

export const getToken = async () => {
  try {
    const credentials =
      await Keychain.getGenericPassword({
        service: TOKEN_KEY,
      });

    if (credentials) {
      return credentials.password;
    }

    return null;
  } catch (error) {
    console.log("Get Token Error:", error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await Keychain.resetGenericPassword({
      service: TOKEN_KEY,
    });
  } catch (error) {
    console.log("Remove Token Error:", error);
  }
};