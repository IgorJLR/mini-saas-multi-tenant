import { GoogleGenAI, Type } from '@google/genai';
import { Product } from '../models/product.model';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface SearchInput {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
}

async function searchProducts(companyId: string, input: SearchInput) {
  const filter: Record<string, unknown> = { companyId };

  if (input.category) {
    filter.category = { $regex: input.category, $options: 'i' };
  }

  if (input.min_price !== undefined || input.max_price !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (input.min_price !== undefined) priceFilter.$gte = input.min_price;
    if (input.max_price !== undefined) priceFilter.$lte = input.max_price;
    filter.price = priceFilter;
  }

  const products = await Product.find(filter).limit(20).lean();

  if (input.query) {
    const q = input.query.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  return products;
}

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description:
          'Search and retrieve products from the company catalog. Always call this before answering any question about products, prices, availability, or recommendations.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: 'Search term to match product name or description' },
            category: { type: Type.STRING, description: 'Filter by product category (e.g. "electronics", "shoes")' },
            min_price: { type: Type.NUMBER, description: 'Minimum price in USD' },
            max_price: { type: Type.NUMBER, description: 'Maximum price in USD' },
          },
        },
      },
    ],
  },
];

const SYSTEM_PROMPT = `You are a friendly and knowledgeable product assistant. Help customers find products using real catalog data.
- Always use the search_products tool before answering any product question
- Be concise and helpful
- Format prices as USD (e.g. $49.99)
- If no products match, say so clearly`;

export async function runChatAgent(companyId: string, userMessage: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents: any[] = [{ role: 'user', parts: [{ text: userMessage }] }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastResponse: any = null;

  // Agentic loop — keep calling until the model stops using tools
  while (true) {
    lastResponse = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents,
      config: { systemInstruction: SYSTEM_PROMPT, tools: TOOLS },
    });

    const candidate = lastResponse.candidates?.[0];
    if (!candidate?.content) break;

    contents.push({ role: 'model', parts: candidate.content.parts });

    const calls = lastResponse.functionCalls;
    if (!calls || calls.length === 0) break;

    const toolResults = await Promise.all(
      calls.map(async (call: { name: string; args?: Record<string, unknown> }) => {
        if (call.name === 'search_products') {
          const products = await searchProducts(companyId, (call.args ?? {}) as SearchInput);
          return {
            functionResponse: {
              name: call.name,
              response: products.length > 0 ? { products } : { message: 'No products found' },
            },
          };
        }
        return { functionResponse: { name: call.name, response: { result: null } } };
      })
    );

    contents.push({ role: 'user', parts: toolResults });
  }

  return lastResponse?.text ?? 'Sorry, I could not generate a response.';
}
