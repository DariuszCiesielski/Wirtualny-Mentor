export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
      <main className="flex flex-col items-center gap-8 px-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-10 w-10 text-white"
            >
              <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224a.36.36 0 0 1 .172-.311 54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
              <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286a48.4 48.4 0 0 1 7.667 3.282.75.75 0 0 0 .822 0h.002Z" />
              <path d="M4.462 19.462a.75.75 0 0 0 .396-1.462 47.93 47.93 0 0 1-1.528-.7.75.75 0 1 0-.684 1.334c.583.298 1.2.572 1.816.828Z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Wirtualny Mentor</h1>
        </div>

        <p className="max-w-xl text-xl text-zinc-400">
          Spersonalizowana platforma nauki z AI
        </p>

        <div className="mt-4 rounded-full border border-violet-500/30 bg-violet-500/10 px-6 py-3">
          <span className="text-sm font-medium text-violet-400">
            Phase 0 - Foundation & AI Architecture
          </span>
        </div>

        <p className="max-w-md text-sm text-zinc-500">
          Projekt w budowie. Fundament dla spersonalizowanego systemu nauczania
          wykorzystujacego AI do tworzenia aktualnych, praktycznych programow nauki.
        </p>
      </main>
    </div>
  );
}
