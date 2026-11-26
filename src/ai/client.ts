export interface ChatConfig {
  apiKey: string
  model: string
  baseUrl: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function streamChat(
  config: ChatConfig,
  messages: ChatMessage[],
  onDelta: (delta: string, full: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: 1.3,
      max_tokens: 1200,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '')
    throw new Error(`模型接口返回 ${response.status}：${detail.slice(0, 200)}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return full
      try {
        const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }
        const delta = parsed.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          full += delta
          onDelta(delta, full)
        }
      } catch {
        continue
      }
    }
  }

  return full
}
