import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface CustomToastProps {
    message: string;
    duration?: number; 
    onClose: () => void; 
}

const CustomToast: React.FC<CustomToastProps> = ({ message, duration = 10000, onClose }) => {
    const [opacity] = useState(new Animated.Value(0));
    const [progress] = useState(new Animated.Value(1));

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
        }).start();

        Animated.timing(progress, {
            toValue: 0,
            duration: duration,
            useNativeDriver: false,
        }).start();

        const timeout = setTimeout(() => {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 3000,
                useNativeDriver: true,
            }).start(() => {
                onClose();
            });
        }, duration);

        return () => clearTimeout(timeout); 
    }, [duration, opacity, progress, onClose]);

    return (
        <Animated.View style={[styles.toastContainer, { opacity }]}>
            <Text style={styles.message}>{message}</Text>
            <Animated.View
                style={[
                    styles.progressBar,
                    {
                        width: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        }),
                    },
                ]}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: '#333',
        borderRadius: 8,
        padding: 10,
        zIndex: 1000,
        elevation: 5,
    },
    message: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 5,
    },
    progressBar: {
        height: 5,
        backgroundColor: '#27c0c2',
        borderRadius: 3,
    },
});

export default CustomToast;