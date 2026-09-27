import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

/**
 * A gently pulsing app logo, used as a branded stand-in for a generic
 * spinner during longer loading states (e.g. AI analysis).
 */
export default function LoadingLogo({ size = 96 }: { size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.Image
        source={require("../../assets/icon-mark.png")}
        resizeMode="contain"
        style={[styles.image, { width: size, height: size, transform: [{ scale }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  image: {},
});
