// utils/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        console.log('Precisa de um dispositivo físico para notificações push');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Permissão para notificações foi negada');
        return null;
    }

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });

        const token = tokenData.data;
        console.log('Token de push gerado:', token);
        return token;
    } catch (error) {
        console.error('Erro ao gerar token de push:', error);
        return null;
    }
}
