import { useEffect, useState } from 'react';
import supabase from '../DB/supabase';

interface Usuario {
  ID_Usuarios: string;
  Nome: string;
  Instituicao: string;
  UID: string;
}

interface Acesso {
  ID_Acesso: number;
  UID: string;
  Nome_usuario: string;
  Dispositivo_id: string;
  entrada: string;
  saida: string | null;
  ID_Usuarios: string | null;
  Usuarios?: Usuario;
}

interface Filmagem {
  ID: number;
  ID_Usuarios: string;
  inicio: string;
  fim: string | null;
  url_video: string | null;
  data: string;
  evento: string | null;
  Usuarios?: Usuario;
}

export function useDadosAcessos(userId: string | undefined) {
    const [acessos, setAcessos] = useState<Acesso[]>([]);
    const [filmagens, setFilmagens] = useState<Filmagem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [instituicao, setInstituicao] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!userId) {
                if (isMounted) {
                    setLoading(false);
                    setAcessos([]);
                    setFilmagens([]);
                }
                return;
            }

            try {
                if (isMounted) {
                    setLoading(true);
                    setError(null);
                }
                
                // 1. Buscar dados do usuário
                const { data: userData, error: userError } = await supabase
                    .from('Tb_Usuarios')
                    .select('Instituicao, UID, Nome')
                    .eq('ID_Usuarios', userId)
                    .single();

                if (userError) throw userError;
                if (!userData) throw new Error('Usuário não encontrado');
                
                const userInstituicao = userData.Instituicao;
                const userUID = userData.UID;

                if (isMounted) {
                    setInstituicao(userInstituicao);
                }

                // 2. Buscar acessos e filmagens em paralelo
                const acessosPromise = supabase
                    .from('TB_acessos')
                    .select(`
                        *,
                        Tb_Usuarios!inner(
                            Instituicao,
                            Nome
                        )
                    `)
                    .eq('Tb_Usuarios.Instituicao', userInstituicao)
                    .order('entrada', { ascending: false });

                const filmagensPromise = supabase
                    .from('Tb_Filmagens')
                    .select(`
                        ID,
                        ID_Usuarios,
                        inicio,
                        fim,
                        url_video,
                        data,
                        evento,
                        Tb_Usuarios!inner(
                            Instituicao,
                            Nome
                        )
                    `)
                    .eq('Tb_Usuarios.Instituicao', userInstituicao)
                    .order('data', { ascending: false });

                const [acessosResponse, filmagensResponse] = await Promise.all([
                    acessosPromise,
                    filmagensPromise
                ]);

                if (acessosResponse.error) throw acessosResponse.error;
                if (filmagensResponse.error) throw filmagensResponse.error;

                if (isMounted) {
                    setAcessos(acessosResponse.data || []);
                    setFilmagens(filmagensResponse.data || []);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message);
                    console.error('Erro ao buscar dados:', err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    return { acessos, filmagens, loading, error, instituicao };
}