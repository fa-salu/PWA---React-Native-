import React from "react";
import { View, Text, ActivityIndicator, Image } from "react-native";
import { styles } from "./LoadingOverlay.styles";

export const LoadingOverlay: React.FC = () => {
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingSubtext}>Connecting to server...</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/adaptive-icon.png")}
          style={styles.companyLogo}
          resizeMode="contain"
        />
        <Text style={styles.companyText}>Golden Signature Trading</Text>
      </View>
    </View>
  );
};
