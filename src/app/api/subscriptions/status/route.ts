import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!authHeader) {
    return NextResponse.json({ subscribed: false }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser(authHeader)
  if (!user) {
    return NextResponse.json({ subscribed: false }, { status: 401 })
  }

  const { count } = await supabase
    .from('cobrancas')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gte('current_period_end', new Date().toISOString())
    .maybeSingle()

  const subscribed = !!sub

  return NextResponse.json({
    subscribed,
    cobrancas_count: count || 0,
    free_limit: subscribed ? Infinity : 3,
    remaining: subscribed ? Infinity : Math.max(0, 3 - (count || 0)),
    plan: subscribed ? 'assinante' : 'free',
    period_end: sub?.current_period_end || null,
  })
}
