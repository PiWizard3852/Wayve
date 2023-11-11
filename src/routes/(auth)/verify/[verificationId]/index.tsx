import { component$ } from '@builder.io/qwik'
import { RequestHandler } from '@builder.io/qwik-city'

import { eq } from 'drizzle-orm'
import * as jose from 'jose'

import { users, verifications } from '~/db/schema'

import { GetDb } from '~/components/Utils'

export const onGet: RequestHandler = async (requestEvent) => {
  const verificationId = requestEvent.params.verificationId

  const db = GetDb(requestEvent)

  const verification = await db.query.verifications.findFirst({
    columns: {
      id: true,
      email: true,
      createdAt: true,
    },
    where: eq(verifications.id, verificationId),
  })

  if (!verification) {
    throw requestEvent.redirect(301, '/login')
  }

  await db.delete(verifications).where(eq(verifications.id, verification.id))

  if (verification.createdAt.getTime() > new Date().getDate() - 1) {
    const user = await db
      .update(users)
      .set({
        emailVerified: true,
      })
      .where(eq(users.email, verification.email))
      .returning()

    const hexSecret = new TextEncoder().encode(
      requestEvent.env.get('AUTH_SECRET'),
    )

    const token = await new jose.SignJWT({ username: user[0].username })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(hexSecret)

    const expiryDate = new Date()
    expiryDate.setDate(new Date().getDate() + 7)

    requestEvent.cookie.set('authToken', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      expires: expiryDate,
    })

    throw requestEvent.redirect(302, '/')
  }
}

export default component$(() => {
  return <></>
})
