import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Gravações = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tela de Gravações</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Gravações;
