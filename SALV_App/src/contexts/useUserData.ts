// src/contexts/useUserData.ts
import { useEffect, useState } from 'react';
import supabase from '../DB/supabase';
import { User } from 'firebase/auth';

export function useUserData(user: User | null) {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('Tb_Usuarios')
                    .select('*')
                    .eq('ID_Usuarios', user.uid)
                    .single();

                if (error) throw error;
                setUserData(data);
            } catch (error: any) {
                console.error('Erro ao buscar dados do usuário:', error.message);
                setErrorMsg('Erro ao carregar perfil');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user?.uid]);

    return { userData, loading, errorMsg };
}
