import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  logoContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  companyLogo: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  companyText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
});
