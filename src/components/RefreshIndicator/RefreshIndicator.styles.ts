import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  refreshIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    flexDirection: "row",
    gap: 10,
  },
  refreshText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
});
