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
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [updatedAtFormatted, setUpdatedAtFormatted] = useState<string | null>(null);
    const [filmagens, setFilmagens] = useState<any[]>([]); // ✅ novo estado para filmagens

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }

            try {
                const { data: userData, error: userError } = await supabase
                    .from('Tb_Usuarios')
                    .select('*')
                    .eq('ID_Usuarios', user.uid)
                    .single();

                if (userError) throw userError;
                setUserData(userData);

                // ✅ Buscar filmagens relacionadas ao usuário
                const { data: filmagensData, error: filmagensError } = await supabase
                    .from('filmagens')
                    .select('id, inicio, fim, duracao, url_video, data, hora_inicio, hora_fim, evento, dispositivo, enviado_com_sucesso, tamanho_arquivo_mb')
                    .order('data', { ascending: false });

                if (filmagensError) throw filmagensError;
                setFilmagens(filmagensData);
            } catch (error: any) {
                console.error('Erro ao buscar dados:', error.message);
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
                    .select('AoVivo, updated_at')
                    .single();

                if (ngrokError) throw ngrokError;

                const isCurrentlyLive = ngrokData?.AoVivo === true;

                if (isCurrentlyLive && !isLiveActive) {
                    await sendNotification();
                }

                setIsLiveActive(isCurrentlyLive);

                const rawDate = ngrokData?.updated_at || null;
                setUpdatedAt(rawDate);

                if (rawDate) {
                    const formatted = formatDateTime(rawDate);
                    setUpdatedAtFormatted(formatted);
                } else {
                    setUpdatedAtFormatted(null);
                }
            } catch (error: any) {
                console.error('Erro ao checar status AoVivo:', error.message);
            }
        };

        interval = setInterval(checkLiveStatus, 600000); // 10 minutos

        return () => clearInterval(interval);
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

    const formatDateTime = (isoString: string): string => {
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return { 
        userData, 
        loading, 
        errorMsg,
        isLiveActive,
        updatedAt,
        updatedAtFormatted,
        ngrokLink,
        filmagens
    };
}
