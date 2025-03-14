import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, LogBox } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthStack from './src/navigation/AuthStack';
import 'react-native-gesture-handler';

interface AccelerometerData {
    x: number;
    y: number;
    z: number;
}

const slides = [
    {
        key: 1,
        title: 'imagem e descrição de eventos',
        text: 'bla bla',
        image: (
            <LottieView
            source={{ uri: 'https://lottie.host/87cabc93-9f60-409f-8c57-019e2a0618f6/FfPuV2SmKT.lottie' }}
            autoPlay
                loop
                style={{ width: 350, height: 400 }}
            />
        ),
    },
    {
        key: 2,
        title: ' ',
        text: '',
        image: (
            <LottieView
                source={{ uri: 'https://lottie.host/87cabc93-9f60-409f-8c57-019e2a0618f6/FfPuV2SmKT.lottie' }}
                autoPlay
                loop
                style={{ width: 400, height: 400 }}
            />
        ),
    },
    {
        key: 3,
        title: 'Ma',
        text: '.',
        image: (
            <LottieView
            source={{ uri: 'https://lottie.host/87cabc93-9f60-409f-8c57-019e2a0618f6/FfPuV2SmKT.lottie' }}
            autoPlay
                loop
                style={{ width: 350, height: 400 }}
            />
        ),
    },
];

function renderSlides({ item, index, setShowAuth }: { item: typeof slides[number]; index: number; setShowAuth: (value: boolean) => void }) {
    const isLastSlide = index === slides.length - 1;

    return (
        <View style={styles.slide}>
            {item.image}
            <Text style={[styles.title, { fontSize: 24 }]}>{item.title}</Text>
            <Text style={[styles.text, { fontSize: 18 }]}>{item.text}</Text>
            {isLastSlide && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={async () => {
                            try {
                                await AsyncStorage.setItem('hasViewedOnboarding', 'true');
                                setShowAuth(true);
                            } catch (error) {
                                console.error('Erro ao salvar status de onboarding:', error);
                            }
                        }}
                    >
                        <Text style={styles.confirmButtonText}>Vamos Lá!</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const Stack = createStackNavigator();

function AppNavigation() {
    const [showAuth, setShowAuth] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const sliderRef = useRef<AppIntroSlider>(null);

    useEffect(() => {
        Ionicons.loadFont(); // Carregar as fontes dos ícones
    }, []);

    useEffect(() => {
        const handleDeviceMotion = (event: DeviceMotionEvent) => {
            const { x, y, z } = event.accelerationIncludingGravity;
            const threshold = 1.5;

            if (Math.abs(x) > threshold) {
                // Para a direita
                if (x > threshold) {
                    setCurrentIndex((prevIndex: number) => {
                        const newIndex = (prevIndex + 1) % slides.length;
                        return newIndex;
                    });
                }
                // Para a esquerda
                else if (x < -threshold) {
                    setCurrentIndex((prevIndex: number) => {
                        const newIndex = (prevIndex - 1 + slides.length) % slides.length;
                        return newIndex;
                    });
                }
            }
        };

        if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleDeviceMotion);
        }

        return () => {
            if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
                window.removeEventListener('devicemotion', handleDeviceMotion);
            }
        };
    }, []);

    // Atualize o goToSlide somente quando o currentIndex mudar
    useEffect(() => {
        if (sliderRef.current) {
            sliderRef.current.goToSlide(currentIndex, true);
        }
    }, [currentIndex]);

    if (showAuth) {
        return <AuthStack />;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <AppIntroSlider
                ref={sliderRef}
                renderItem={(props) => renderSlides({ ...props, setShowAuth })}
                data={slides}
                onDone={() => {
                    setShowAuth(true);
                }}
                onSlideChange={(index: any) => {
                    setCurrentIndex(index);
                }}
                dotStyle={styles.dotStyle}
                activeDotStyle={styles.activeDotStyle}
                showNextButton={false}
                showDoneButton={false}
            />
            <View style={styles.circularProgressContainer}>
                <AnimatedCircularProgress
                    size={100}
                    width={10}
                    fill={(currentIndex / (slides.length - 1)) * 100}
                    tintColor="#27c0c2"
                    backgroundColor="#ccc"
                >
                    {() => (
                        <TouchableOpacity
                            style={styles.innerCircle}
                            onPress={() => {
                                setCurrentIndex((prevIndex) => {
                                    const nextIndex = (prevIndex + 1) % slides.length;
                                    if (sliderRef.current) {
                                        sliderRef.current.goToSlide(nextIndex, true);
                                    }
                                    return nextIndex;
                                });
                            }}
                        >
                            <Ionicons name="arrow-forward" size={40} color="#27c0c2" />
                        </TouchableOpacity>

                    )}
                </AnimatedCircularProgress>
            </View>
        </View>
    );
}

export default function App() {
    useEffect(() => {
        if (__DEV__) {
            LogBox.ignoreAllLogs();
        }
    }, []);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Intro" component={AppNavigation} />
                <Stack.Screen name="Auth" component={AuthStack} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#a4c3d6',
        justifyContent: 'flex-start',
    },
    slide: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    title: {
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
        color: '#000',
    },
    text: {
        textAlign: 'center',
        marginTop: 10,
        color: '#000',
    },
    circularProgressContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    innerCircle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    confirmButton: {
        padding: 10,
        backgroundColor: '#27c0c2',
        borderRadius: 5,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dotStyle: {
        backgroundColor: 'transparent',
    },
    activeDotStyle: {
        backgroundColor: 'transparent',
    },
});
