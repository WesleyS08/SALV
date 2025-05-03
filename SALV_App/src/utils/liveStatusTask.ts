import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import supabase from '../DB/supabase';
import * as BackgroundFetch from 'expo-background-fetch';

const LIVE_STATUS_TASK = 'LIVE_STATUS_CHECK';

TaskManager.defineTask(LIVE_STATUS_TASK, async () => {
    const now = new Date();
    console.log(`[${now.toISOString()}] Tarefa de background executada`);

    try {
        const { data, error } = await supabase
            .from('ngrok_links')
            .select('AoVivo')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        const aoVivo = data && data.length > 0 ? data[0].AoVivo : false;

        if (aoVivo) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🚨 Transmissão ao vivo detectada!',
                    body: 'Alerta! Verifique sua transmissão imediatamente!',
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
            });
            console.log('Notificação enviada');
            return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        console.error('Erro na tarefa:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export { LIVE_STATUS_TASK };