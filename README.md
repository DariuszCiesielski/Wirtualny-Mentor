This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Wirtualny Mentor

Platforma edukacyjna AI do tworzenia kursów, lekcji, quizów i czatu mentora.

## Regeneracja Lekcji (Nowe)

Dodano możliwość ponownego generowania materiałów lekcji na każdym etapie.

### Co potrafi regeneracja

- Regeneracja `od zera` (pełny przebieg: wyszukiwanie -> generowanie -> zapis)
- Regeneracja `od wybranego etapu`:
  - `searching` (wyszukiwanie źródeł)
  - `generating` (generowanie treści)
  - `saving` (ponowienie zapisu)
- Pole na instrukcje użytkownika:
  - co zmienić
  - co uzyskać
  - co się nie podobało
  - co zachować

### Gdzie w UI

- Strona lekcji: przycisk `Regeneruj lekcję`
- Dialog z wyborem trybu/etapu i dodatkowych instrukcji

### API

Endpoint: `POST /api/materials/generate`

Nowe pola requestu:

- `forceRegenerate: boolean`
- `regenerationMode: "from_scratch" | "from_stage"`
- `startStage: "searching" | "generating" | "saving"`
- `regenerationInstructions: string`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
