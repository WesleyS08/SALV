import { useEffect, useState } from 'react';
import supabase from '../DB/supabase';
import { User } from 'firebase/auth';

export function useUserData(user: User | null) {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [ngrokData, setNgrokData] = useState<{
        url: string | null;
        updated_at: string | null;
    }>({
        url: null,
        updated_at: null
    });
    const [filmagens, setFilmagens] = useState<any[]>([]);

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

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Buscar dados do usuário
                const { data: userData, error: userError } = await supabase
                    .from('Tb_Usuarios')
                    .select('*')
                    .eq('ID_Usuarios', user.uid)
                    .single();

                if (userError) throw userError;
                setUserData(userData);

                // Buscar filmagens do usuário
                const { data: filmagensData, error: filmagensError } = await supabase
                    .from('Tb_Filmagens') 
                    .select('*')
                    .eq('ID_Usuarios', user.uid) 
                    .order('data', { ascending: false });

                if (filmagensError) throw filmagensError;
                setFilmagens(filmagensData || []);
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

        const checkLiveStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('ngrok_links')
                    .select('AoVivo, updated_at, url')
                    .eq('ID_Usuarios', user.uid)  // Adicionando o filtro para o ID_Usuarios
                    .single();

                if (error) throw error;

                const isCurrentlyLive = data?.AoVivo === true;
                const currentUrl = data?.url || null;
                const currentUpdatedAt = data?.updated_at || null;

                // Atualizar estados apenas se houver mudanças
                if (isCurrentlyLive !== isLiveActive) {
                    setIsLiveActive(isCurrentlyLive);
                }

                if (currentUrl !== ngrokData.url || currentUpdatedAt !== ngrokData.updated_at) {
                    setNgrokData({
                        url: currentUrl,
                        updated_at: currentUpdatedAt
                    });
                }
            } catch (error: any) {
                console.error('Erro ao checar status AoVivo:', error.message);
            }
        };

        // Verificar status ao vivo e atualizar a cada 10 minutos
        checkLiveStatus();
        const interval = setInterval(checkLiveStatus, 600000);

        return () => clearInterval(interval);
    }, [user?.uid, isLiveActive, ngrokData.url, ngrokData.updated_at]);

    return { 
        userData, 
        loading, 
        errorMsg,
        isLiveActive,
        updatedAt: ngrokData.updated_at ? formatDateTime(ngrokData.updated_at) : null,
        ngrokLink: ngrokData.url, 
        filmagens
    };
}
