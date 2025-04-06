import { useEffect, useState } from 'react';
import supabase from '../DB/supabase';

export function useFilmagens() {
    const [filmagens, setFilmagens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFilmagens = async () => {
            const { data, error } = await supabase
                .from('filmagens')
                .select('*')
                .order('data', { ascending: false });

            if (!error && data) setFilmagens(data);
            setLoading(false);
        };

        fetchFilmagens();
    }, []);

    return { filmagens, loading };
}
