# Garage Sale (POC)

A Next.js proof-of-concept app that:
1. uploads many item photos,
2. uses OpenAI Vision to identify each image,
3. generates embeddings to group photos of the same item,
4. returns draft Facebook Marketplace fields (title, price, description), and
5. lets the user add seller notes before final post copy.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Create `.env.local` with:

```bash
OPENAI_API_KEY=your_api_key_here
```

## How it works

- `POST /api/analyze` accepts `multipart/form-data` with repeated `photos` fields.
- Each image is sent to `gpt-4.1-mini` for structured extraction (`itemType`, `condition`, details, title, description, suggested price).
- A text embedding (`text-embedding-3-small`) is created from extracted attributes.
- Simple cosine-similarity clustering groups images likely representing the same item.
- The UI renders editable listing cards with note support.

## Notes

- This is intentionally auth-free for prototype speed.
- Price is model-suggested; user should verify before posting.
