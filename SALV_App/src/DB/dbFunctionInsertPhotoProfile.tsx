import supabase from './supabase';

export const dbFunctionInsertPhotoProfile = async (userId: string, imageBase64: string, nome: string) => {
    try {
        const bucketName = 'FotosDePerfil'; // Bucket único para fotos de perfil

        // Verificar se o bucket 'FotosDePerfil' já existe
        const { data: existingBucket, error: fetchBucketError } = await supabase.storage
            .from('buckets')
            .list();

        if (fetchBucketError) {
            console.error('Erro ao buscar buckets:', fetchBucketError.message);
            return;
        }

        const bucketExists = existingBucket?.some(bucket => bucket.name === bucketName);

        // Caso o bucket não exista, cria o bucket
        if (!bucketExists) {
            const { error: createBucketError } = await supabase.storage
                .createBucket(bucketName, { public: true });

            if (createBucketError) {
                if (createBucketError.message.includes('The resource already exists')) {
                    console.log(`O bucket ${bucketName} já existe.`);
                } else {
                    console.error('Erro ao criar bucket:', createBucketError.message);
                    return;
                }
            }
        }

        const fileName = 'profile-photo';
        const userFolder = `${nome}-${userId}`; // Subpasta baseada no nome e userId

        const base64Data = imageBase64.startsWith('data:image/')
            ? imageBase64.split(',')[1]
            : imageBase64;

        const binaryData = new Uint8Array(atob(base64Data).split('').map(char => char.charCodeAt(0)));

        const mimeType = 'image/png';

        // Faz o upload da imagem para o Supabase na subpasta
        const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(`${userFolder}/${fileName}.png`, binaryData, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType,
            });

        if (uploadError) {
            console.error('Erro ao fazer o upload da imagem:', uploadError.message);
            return;
        }

        // Obtém a URL pública do arquivo carregado
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(`${userFolder}/${fileName}.png`);

        if (!urlData) {
            console.error('Erro ao gerar URL pública');
            return;
        }

        const publicUrl = urlData.publicUrl;

        // Atualiza a URL da foto de perfil na tabela 'usuarios'
        const { data: updateData, error: updateError } = await supabase
            .from('usuarios')
            .update({ photoURL: publicUrl })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Erro ao atualizar o photoURL na tabela usuarios:', updateError.message);
            return;
        }

        return publicUrl;

    } catch (error) {
        console.error('Erro ao inserir foto de perfil:', error);
    }
};