import { useEffect, useState } from 'react';
import supabase from '../DB/supabase';

export function useAcessos() {
    const [acessos, setAcessos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAcessos = async () => {
            const { data, error } = await supabase
                .from('TB_acessos')
                .select('*')
                .order('entrada', { ascending: false });

            if (!error && data) setAcessos(data);
            setLoading(false);
        };

        fetchAcessos();
    }, []);

    return { acessos, loading };
}
