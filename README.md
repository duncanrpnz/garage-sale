# Garage Sale (POC)

A Next.js proof-of-concept app that:
1. uploads many item photos,
2. uses OpenAI Vision to identify each image,
3. generates image embeddings to group photos of the same item,
4. returns draft Facebook Marketplace fields (title, price, description), and
5. lets the user add seller notes before final post copy, and
6. allows manual merging of AI-created groups when duplicates are split.

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
- An image embedding (`multimodal-embedding-1`) is created directly from each photo.
- Simple cosine-similarity clustering groups images likely representing the same item.
- The UI renders editable listing cards with note support.
- Users can manually select two or more groups and merge them into one listing when clustering is imperfect.

## Notes

- This is intentionally auth-free for prototype speed.
- Price is model-suggested; user should verify before posting.
