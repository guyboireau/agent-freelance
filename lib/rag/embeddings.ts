import { openai } from '@ai-sdk/openai'
import { embed, embedMany } from 'ai'

const MODEL = openai.embedding('text-embedding-3-small')

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: MODEL, value: text })
  return embedding
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model: MODEL, values: texts })
  return embeddings
}

export function projectToText(p: {
  name: string
  client: string
  type: string
  description: string
  stack: string[]
}): string {
  return `Projet : ${p.name}\nClient : ${p.client}\nType : ${p.type}\nDescription : ${p.description}\nStack : ${p.stack.join(', ')}`
}
