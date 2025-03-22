// logger.tsx
const logStyles = {
    error: '\x1b[31m', // Red
    success: '\x1b[32m', // Green
    search: '\x1b[34m', // Blue
    reset: '\x1b[0m', // Reset color
};

// Função para logar mensagens
export function logError(message: any, error: any) {
    console.log(`${logStyles.error}🔴 [ERROR] ${message}${logStyles.reset}`, error);
}

export function logSuccess(message: any) {
    console.log(`${logStyles.success}✅ [SUCCESS] ${message}${logStyles.reset}`);
}

export function logSearch(message: any, data: any) {
    console.log(`${logStyles.search}📊 [RESULT] ${JSON.stringify(data, null, 2)}${logStyles.reset}`);
}