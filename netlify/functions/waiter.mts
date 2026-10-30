import menu from '../../menu.json' with { type: 'json' }

type Item = [string, number, 'lbp' | 'usd']
type Turn = { role: 'user' | 'assistant'; content: string }

const MODEL = 'claude-haiku-5-5'
const MAX_TURNS = 12
const MAX_CHARS = 800

const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n))

function menuText() {
  return (menu.groups as { name: string; items: Item[] }[])
    .map((g) => {
      const lines = g.items.map(([name, price, type]) =>
        type === 'usd'
          ? `- ${name}: $${price} (${fmt(price * menu.rate)} LBP)`
          : `- ${name}: ${fmt(price * 1000)} LBP`,
      )
      return `${g.name}:\n${lines.join('\n')}`
    })
    .join('\n\n')
}

function systemPrompt() {
  return `You are the friendly AI waiter for Flipped Dough, a local pizza & manakish shop in Dhour El Choueir, Lebanon.

You ONLY help customers with three topics:
1. Prices of menu items (and totals for combinations they ask about).
2. Delivery time: delivery takes a MAXIMUM of ${menu.deliveryMaxMinutes} minutes. Never promise more precise times and never say it may take longer.
3. Food items: what is on the menu, categories, and simple descriptions/recommendations based on the item names.

Rules:
- Use only the menu below. Never invent items, prices, ingredients beyond what the item name clearly implies, discounts or offers. If something isn't on the menu, say so and suggest a similar item.
- Prices: show USD items as "$X (Y LBP)". Exchange rate is $1 = ${fmt(menu.rate)} LBP. When adding up a total, show the LBP total, and double-check your arithmetic.
- For anything outside prices, delivery time, or food items (complaints, allergies, opening hours, order status, payment issues, etc.), politely say you can only help with those topics and invite them to contact the shop on WhatsApp at 70 321 545.
- To order, customers add items with the "+" buttons on the menu and send the order via WhatsApp from the "Complete your order" section.
- Reply in the same language the customer uses (English, Arabic, Lebanese Arabizi, French). Keep answers short, warm and to the point (1–4 sentences or a short list). Plain text only: no markdown bold, headings or tables.

MENU
${menuText()}`
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let messages: Turn[]
  try {
    const body = await req.json()
    messages = (Array.isArray(body?.messages) ? body.messages : [])
      .filter((m: Turn) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-MAX_TURNS)
      .map((m: Turn) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return Response.json({ error: 'Please send a question.' }, { status: 400 })
  }

  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 500, system: systemPrompt(), messages }),
  })

  if (!res.ok) {
    console.error('Waiter AI error', res.status, await res.text())
    return Response.json(
      { error: 'The waiter is busy right now. Please try again or message us on WhatsApp at 70 321 545.' },
      { status: 502 },
    )
  }

  const data = await res.json()
  const reply = (data.content ?? [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('')
    .replace(/\*\*/g, '')
    .trim()

  return Response.json({ reply })
}

export const config = { path: '/api/waiter' }
