// src/contexts/useUserData.ts
import { useEffect, useState } from 'react';
import supabase from '../DB/supabase';
import { User } from 'firebase/auth';
import * as Notifications from 'expo-notifications';

export function useUserData(user: User | null) {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [ngrokLink, setNgrokLink] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }

            try {
                // Busca dados do usuário
                const { data: userData, error: userError } = await supabase
                    .from('Tb_Usuarios')
                    .select('*')
                    .eq('ID_Usuarios', user.uid)
                    .single();

                if (userError) throw userError;
                setUserData(userData);
            } catch (error: any) {
                console.error('Erro ao buscar dados do usuário:', error.message);
                setErrorMsg('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid) return;

        let interval: NodeJS.Timeout;

        const checkLiveStatus = async () => {
            try {
                const { data: ngrokData, error: ngrokError } = await supabase
                    .from('ngrok_links')
                    .select('AoVivo')
                    .single();

                if (ngrokError) throw ngrokError;

                const isCurrentlyLive = ngrokData?.AoVivo === true;

                // Se mudou para ativo e antes estava inativo, dispara notificação
                if (isCurrentlyLive && !isLiveActive) {
                    await sendNotification();
                }

                setIsLiveActive(isCurrentlyLive);
            } catch (error: any) {
                console.error('Erro ao checar status AoVivo:', error.message);
            }
        };

        interval = setInterval(checkLiveStatus, 600000); // 600.000 ms = 10 minutos

        return () => clearInterval(interval); // limpa o intervalo ao desmontar
    }, [user?.uid, isLiveActive]);

    const sendNotification = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            console.log('Permissão de notificação negada!');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🚨 Transmissão ao vivo!',
                body: 'Clique aqui para acompanhar agora.',
                sound: 'default',
            },
            trigger: null,
        });
    };

    return { 
        userData, 
        loading, 
        errorMsg,
        isLiveActive,
        ngrokLink
    };
}
