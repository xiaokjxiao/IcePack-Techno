import { StyleSheet } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";

export default function CreateScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#cce4f3", dark: "#156ba8" }}
      headerImage={
        <ThemedText>+</ThemedText>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          Create
        </ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedText>Create a new trip here.</ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
