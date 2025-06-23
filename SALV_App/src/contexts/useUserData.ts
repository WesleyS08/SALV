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

    return {
        userData,
        loading,
        errorMsg,
        isLiveActive,
        filmagens
    };
}
