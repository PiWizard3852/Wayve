import type { Signal } from '@builder.io/qwik'
import { createContextId } from '@builder.io/qwik'
import { RequestEvent, RequestEventAction } from '@builder.io/qwik-city'

import { eq } from 'drizzle-orm'
import * as jose from 'jose'

import { users } from '~/db/schema'

import { GetDb } from '~/components/Utils'

export const AuthContext = createContextId<Signal>('auth-context')

type DecodedToken = {
  payload: {
    username: string
  }
}

export const VerifyAuth = async (
  requestEvent: RequestEventAction | RequestEvent,
): Promise<{ username: string } | undefined> => {
  const token = requestEvent.cookie.get('authToken')

  if (!token) {
    return undefined
  }

  const hexSecret = new TextEncoder().encode(
    requestEvent.env.get('AUTH_SECRET'),
  )
  const decoded = (await jose.jwtVerify(token.value, hexSecret, {
    algorithms: ['HS256'],
  })) as DecodedToken

  const db = GetDb(requestEvent)

  const user = await db.query.users.findFirst({
    where: eq(users.username, decoded.payload.username),
    columns: {
      username: true,
    },
  })

  if (!user) {
    requestEvent.cookie.delete('authToken')
    return undefined
  }

  return user
}
