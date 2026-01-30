'use client';

import { useState } from 'react';

export default function Home() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function testAI() {
    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('/api/test-ai');

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setResponse(prev => prev + chunk);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Wirtualny Mentor
          </h1>
          <p className="text-xl text-gray-300">
            Spersonalizowana platforma nauki z AI
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Phase 0: Foundation & AI Architecture
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-4">Test AI Connection</h2>

          <button
            onClick={testAI}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                     text-white font-medium py-3 px-6 rounded-lg
                     transition-colors duration-200"
          >
            {loading ? 'AI odpowiada...' : 'Przetestuj AI'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-300">{error}</p>
              <p className="text-sm text-red-400 mt-2">
                Sprawdz czy klucze API sa skonfigurowane w .env.local
              </p>
            </div>
          )}

          {response && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Odpowiedz AI:</p>
              <p className="text-gray-100 whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Kliknij przycisk powyzej aby przetestowac polaczenie z AI.
          <br />
          Wymaga skonfigurowanych kluczy API w .env.local
        </p>
      </div>
    </main>
  );
}
