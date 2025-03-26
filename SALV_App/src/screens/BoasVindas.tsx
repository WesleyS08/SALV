import React, { useEffect } from 'react';
import { Text, StyleSheet, View, Image, TouchableOpacity, SafeAreaView, ScrollView, Animated, Easing } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    flex: 1,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Rubik',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(5px)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
    marginTop: 4,
    fontSize: 20,
    color: '#FFFFFF',
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '500',
    lineHeight: 24,
    flex: 1,
  },
  securityText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Rubik',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 24,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    height: 54,
    backgroundColor: '#04C6AE',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 50,
  },
});

interface ParticleProps {
  size: number;
  left: number; 
  top: number;  
  duration: number;
  delay: number;
}

const Particle: React.FC<ParticleProps> = ({ size, left, top, duration, delay }) => {
  const animValue = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          left,
          top,
          transform: [{ translateY }],
          opacity: animValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.6, 1, 0.6],
          }),
        },
      ]}
    />
  );
};

export default function Index() {
  const navigation = useNavigation();
  const colorAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const color1 = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#2B5876', '#4E4376', '#2B5876'],
  });

  const color2 = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#4E4376', '#2B5876', '#4E4376'],
  });

  const particles = Array.from({ length: 15 }).map((_, i) => (
    <Particle
      key={i}
      size={Math.random() * 5 + 3}
      left={`${Math.random() * 100}%`}
      top={`${Math.random() * 100}%`}
      duration={Math.random() * 3000 + 2000}
      delay={Math.random() * 2000}
    />
  ));

  return (
    <View style={styles.container}>
      <AnimatedLinearGradient
        colors={[color1, color2]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {particles}
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Image source={require('../images/logo.png')} style={styles.logo} />
          <Text style={styles.welcomeText}>Bem-vindo ao SALV</Text>
          <Text style={styles.descriptionText}>
            O sistema que auxilia em vigilância e proteção de ambientes laboratoriais, garantindo segurança e controle.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔹</Text>
              <Text style={styles.featureText}>
                Monitoramento em tempo real para um ambiente mais seguro
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔹</Text>
              <Text style={styles.featureText}>
                Alertas inteligentes para potenciais riscos e anomalias
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔹</Text>
              <Text style={styles.featureText}>
                Registro completo de acessos para controle e transparência
              </Text>
            </View>
          </View>
          
          <Text style={styles.securityText}>
            Sua segurança e a integridade do laboratório são nossa prioridade máxima.
          </Text>
        </ScrollView>
        
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <TouchableOpacity 
            style={styles.buttonContainer} 
            onPress={() => navigation.navigate('Autenticacao')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Próximo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}