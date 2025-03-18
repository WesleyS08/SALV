import React, { useLayoutEffect, useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Modal, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const EsqueciSenha = ({ navigation }: any) => {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <ImageBackground
          source={require('../images/seta.png')}
          style={styles.background} 
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.voltar}>Voltar</Text>
      </TouchableOpacity>
      
      <ImageBackground
        source={require('../images/biometria.png')}
        style={styles.email}
      />
      <Text style={styles.title}>Faça Login com Biometria</Text>
      <Text style={styles.title1}>Coloque seu dedo para autenticar-se.</Text>
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    width: 24,
    height: 24,
    left: -160,
    top: -190,
  },
  voltar: {
    width: 206,
    height: 23,
    fontFamily: "Roboto",
    fontSize: 17,
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: 23,
    color: "#000000",
    top: -210,
    marginBottom: 20,
    left: -38,
  },
  email: {
    width: 41, // Ajuste o tamanho conforme necessário
    height: 51, // Ajuste o tamanho conforme necessário
    marginTop: 20, // Adicione margem superior para ajustar a posição
    marginBottom: 20, // Adicione margem inferior para ajustar a posição
    alignSelf: 'center', // Centraliza o ícone horizontalmente
    top: -180,
    left: -140,
  },
  title: {
    width: 406,
    height: 53,
    fontFamily: "Regular 400",
    fontSize: 24,
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: 23,
    color: "#000000",
    top: -150,
    marginBottom: 20,
    left: 40,
    flexWrap: 'nowrap', // Impede a quebra de linha
  },
  title1: {
    width: 336,
    height: 20,
    fontFamily: "Roboto",
    fontSize: 15,
    fontWeight: "400",
    fontStyle: "normal",
    lineHeight: 20,
    color: "#000000",
    left: 4,
    top: -180,
  },
});

export default EsqueciSenha;