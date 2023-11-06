import { component$, useSignal } from '@builder.io/qwik'
import { globalAction$, useNavigate, z, zod$ } from '@builder.io/qwik-city'

import { eq } from 'drizzle-orm'
import * as jose from 'jose'
import { toast } from 'wc-toast'

import { users } from '~/db/schema'

import {
  GenerateError,
  GenerateSuccess,
  GetDb,
  HashText,
  Loading,
  ParseError,
  ParseSuccess,
} from '~/components/Utils'

export const useLogin = globalAction$(
  async (data, requestEvent) => {
    const db = await GetDb(requestEvent)

    const user = await db.query.users.findFirst({
      columns: {
        username: true,
        password: true,
      },
      where: eq(users.email, data.email),
    })

    const passwordsMatch =
      (await HashText(data.password, requestEvent)) === user.password

    if (!user || !passwordsMatch) {
      return requestEvent.fail(
        400,
        GenerateError('password', 'Invalid email or password'),
      )
    }

    const hexSecret = new TextEncoder().encode(
      requestEvent.env.get('AUTH_SECRET'),
    )

    const token = await new jose.SignJWT({ username: user.username })
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

    return GenerateSuccess('Successfully logged in!')
  },
  zod$({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .nonempty({ message: 'Fill in all fields' }),
    password: z.string().nonempty({ message: 'Fill in all fields' }),
  }),
)

export default component$(() => {
  const navigate = useNavigate()
  const login = useLogin()

  const loading = useSignal(false)

  const email = useSignal('')
  const password = useSignal('')

  return (
    <form class='flex h-min min-h-[calc(100vh-130px)] w-full flex-col items-center rounded-[8px] border border-border bg-white px-[20px] py-[40px]'>
      <h1 class='mb-[20px] text-[23px]'>Log In</h1>
      <input
        type='text'
        placeholder='Email'
        bind:value={email}
        class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] outline-none'
      />
      <input
        type='password'
        placeholder='Password'
        bind:value={password}
        class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] outline-none'
      />
      <button
        preventdefault:click
        class='cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
        onClick$={async () => {
          loading.value = true

          const res = await login.submit({
            email: email.value,
            password: password.value,
          })

          if (res.status === 200) {
            toast.success(ParseSuccess(res).message)
            await navigate('/')
          } else {
            toast.error(ParseError(res, ['email', 'password']))
          }

          loading.value = false
        }}
      >
        {loading.value ? <Loading /> : 'Log in'}
      </button>
    </form>
  )
})
