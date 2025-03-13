import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{ title: '' }} // Defina o título como vazio para remover
      />
    </Stack>
  );
}