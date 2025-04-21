// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
    let token;

    if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Permissão de notificação negada!');
            return;
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token:', token);
    } else {
        console.log('Precisa de um dispositivo físico para notificações push');
    }

    return token;
}
