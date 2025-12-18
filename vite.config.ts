import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica tutte le variabili d'ambiente (il terzo parametro '' carica tutto senza prefisso)
  // FIX: Type cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Logica di fallback: se l'utente ha usato VITE_API_KEY invece di API_KEY, la usiamo lo stesso
  const finalApiKey = env.API_KEY || env.VITE_API_KEY;

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: false,
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    define: {
      // FIX: Espone esplicitamente API_KEY per assicurarsi che venga letta nel codice
      'process.env.API_KEY': JSON.stringify(finalApiKey),
      // Fallback per altre variabili e compatibilità
      'process.env': JSON.stringify(env)
    }
  }
})