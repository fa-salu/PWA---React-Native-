import { JSX } from "react";
import { Image, Text, View } from "react-native";

export function CustomSplashScreen(): JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 60,
      }}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image
          source={require("../../assets/adaptive-icon.png")}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#1976D2",
            marginTop: 20,
          }}
        >
          Golden Signature
        </Text>
      </View>

      <View style={{ alignItems: "center" }}>
        <Image
          source={require("../../assets/splash-icon.png")}
          style={{ width: 60, height: 60, marginBottom: 8 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 12, color: "#666" }}>
          Powered by Golden Signature Trading
        </Text>
      </View>
    </View>
  );
}
