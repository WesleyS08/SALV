import { useEffect, useState } from 'react';
import supabase from '../DB/supabase';

export function useDadosAcessos() {
    const [acessos, setAcessos] = useState<any[]>([]);
    const [filmagens, setFilmagens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: acessosData, error: acessosError } = await supabase
                    .from('TB_acessos')
                    .select('*')
                    .order('entrada', { ascending: false });

                const { data: filmagensData, error: filmagensError } = await supabase
                    .from('filmagens')
                    .select('*')
                    .order('data', { ascending: false });

                if (acessosError || filmagensError) {
                    throw new Error('Erro ao buscar dados do Supabase');
                }

                setAcessos(acessosData || []);
                setFilmagens(filmagensData || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { acessos, filmagens, loading, error };
}
