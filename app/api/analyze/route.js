import OpenAI from 'openai';
import { groupByEmbedding } from '@/lib/group';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function analyzeImage(base64Image) {
  const result = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Identify the single physical item in this photo for Facebook Marketplace. Return strict JSON with keys: itemType, condition, keyDetails (array), suggestedPriceUsd (number), title, description. Use concise marketplace language and realistic used price.'
          },
          {
            type: 'input_image',
            image_url: `data:image/jpeg;base64,${base64Image}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'marketplace_item',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            itemType: { type: 'string' },
            condition: { type: 'string' },
            keyDetails: { type: 'array', items: { type: 'string' } },
            suggestedPriceUsd: { type: 'number' },
            title: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['itemType', 'condition', 'keyDetails', 'suggestedPriceUsd', 'title', 'description']
        }
      }
    }
  });

  return JSON.parse(result.output_text);
}

async function createEmbedding(text) {
  const embedding = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });

  return embedding.data[0].embedding;
}

function mergeGroup(group) {
  const top = group.evidence[0];
  const detailSet = new Set();

  for (const evidence of group.evidence) {
    for (const detail of evidence.keyDetails) detailSet.add(detail);
  }

  return {
    id: group.id,
    images: group.images,
    title: top.title,
    price: top.suggestedPriceUsd,
    description: `${top.description}\n\nDetails:\n- ${Array.from(detailSet).join('\n- ')}`,
    notes: ''
  };
}

export async function POST(req) {
  if (!client) {
    return Response.json({ error: 'OPENAI_API_KEY is missing.' }, { status: 500 });
  }

  const formData = await req.formData();
  const files = formData.getAll('photos');

  if (!files.length) {
    return Response.json({ error: 'Upload at least one photo.' }, { status: 400 });
  }

  const analyses = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString('base64');
    const analysis = await analyzeImage(base64);
    const embeddingText = [analysis.itemType, analysis.condition, ...analysis.keyDetails].join(' | ');
    const embedding = await createEmbedding(embeddingText);

    analyses.push({
      image: `data:${file.type || 'image/jpeg'};base64,${base64}`,
      analysis,
      embedding
    });
  }

  const grouped = groupByEmbedding(analyses).map(mergeGroup);
  return Response.json({ items: grouped });
}
