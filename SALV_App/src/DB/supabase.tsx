import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '@env';

// Verifica se as variáveis estão carregadas corretamente
if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('⚠️ Configuração do Supabase incompleta! Verifique seu arquivo .env.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase; 