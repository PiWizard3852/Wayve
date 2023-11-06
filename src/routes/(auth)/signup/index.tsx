import { component$, useSignal } from '@builder.io/qwik'
import { globalAction$, useNavigate, z, zod$ } from '@builder.io/qwik-city'

import { eq, ilike } from 'drizzle-orm'
import { toast } from 'wc-toast'
import { useLogin } from '~/routes/(auth)/login'

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

export const useValidate = globalAction$(
  async (data, requestEvent) => {
    if (data.password !== data.passwordConf) {
      return requestEvent.fail(
        400,
        GenerateError('password', 'Passwords do not match'),
      )
    }

    const db = await GetDb(requestEvent)

    const emailTaken = await db.query.users.findFirst({
      columns: {
        username: true,
      },
      where: eq(users.email, data.email),
    })

    if (emailTaken) {
      return requestEvent.fail(
        400,
        GenerateError('email', 'Email is already in use'),
      )
    }

    return GenerateSuccess()
  },
  zod$({
    firstName: z
      .string()
      .trim()
      .nonempty({ message: 'Fill in all fields' })
      .max(90, { message: 'First name exceeds character limit' }),
    lastName: z
      .string()
      .trim()
      .nonempty({ message: 'Fill in all fields' })
      .max(90, { message: 'Last name exceeds character limit' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .nonempty({ message: 'Fill in all fields' })
      .email({ message: 'Enter a valid email' })
      .max(180, { message: 'Email name exceeds character limit' }),
    password: z
      .string()
      .nonempty({ message: 'Fill in all fields' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(60, { message: 'Password exceeds character limit' }),
    passwordConf: z.string().nonempty({ message: 'Fill in all fields' }),
  }),
)

export const useSignup = globalAction$(
  async (data, requestEvent) => {
    if (data.password !== data.passwordConf) {
      return requestEvent.fail(
        400,
        GenerateError('password', 'Passwords do not match'),
      )
    }

    const db = await GetDb(requestEvent)

    const emailTaken = await db.query.users.findFirst({
      columns: {
        username: true,
      },
      where: eq(users.email, data.email),
    })

    if (emailTaken) {
      return requestEvent.fail(
        400,
        GenerateError('email', 'Email is already in use'),
      )
    }

    const plainTextUsername = data.username.replace(/[^a-zA-Z0-9]/g, '')

    if (data.username !== plainTextUsername) {
      return requestEvent.fail(
        400,
        GenerateError('email', 'Username may only contain letters and numbers'),
      )
    }

    const usernameTaken = await db.query.users.findMany({
      columns: {
        username: true,
      },
      where: ilike(users.username, data.username),
    })

    for (let i = 0; i < usernameTaken.length; i++) {
      if (usernameTaken[i].username.length === data.username.length) {
        return requestEvent.fail(
          400,
          GenerateError('username', 'Username is already in use'),
        )
      }
    }

    await db.insert(users).values({
      name: data.firstName + ' ' + data.lastName,
      email: data.email,
      password: await HashText(data.password, requestEvent),
      username: data.username,
    })

    return GenerateSuccess('Account successfully created! Redirecting...')
  },
  zod$({
    firstName: z
      .string()
      .trim()
      .nonempty({ message: 'Fill in all fields' })
      .max(90, { message: 'First name exceeds character limit' }),
    lastName: z
      .string()
      .trim()
      .nonempty({ message: 'Fill in all fields' })
      .max(90, { message: 'Last name exceeds character limit' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .nonempty({ message: 'Fill in all fields' })
      .email({ message: 'Enter a valid email' })
      .max(180, { message: 'Email name exceeds character limit' }),
    password: z
      .string()
      .nonempty({ message: 'Fill in all fields' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(60, { message: 'Password exceeds character limit' }),
    passwordConf: z.string().nonempty({ message: 'Fill in all fields' }),
    username: z
      .string()
      .trim()
      .nonempty({ message: 'Fill in all fields' })
      .max(50, { message: 'Username exceeds character limit' }),
  }),
)

export default component$(() => {
  const navigate = useNavigate()

  const validate = useValidate()
  const signup = useSignup()
  const login = useLogin()

  const loading = useSignal(false)
  const activePage = useSignal<1 | 2>(1)

  const firstName = useSignal('')
  const lastName = useSignal('')
  const email = useSignal('')
  const password = useSignal('')
  const passwordConf = useSignal('')
  const username = useSignal('')

  return (
    <form class='flex h-min min-h-[calc(100vh-130px)] w-full flex-col items-center rounded-[8px] border border-border bg-white px-[20px] py-[40px]'>
      <h1 class='mb-[20px] text-[23px]'>Sign Up</h1>
      {activePage.value === 1 ? (
        <>
          <div class='mb-[20px] flex w-[calc(60%+20px)] min-w-[270px] max-w-[370px]'>
            <input
              type='text'
              placeholder='First Name'
              bind:value={firstName}
              class='mr-[5px] w-[50%] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
            />
            <input
              type='text'
              placeholder='Last Name'
              bind:value={lastName}
              class='ml-[5px] w-[50%] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
            />
          </div>
          <input
            type='text'
            placeholder='Email'
            bind:value={email}
            class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
          />
          <input
            type='password'
            placeholder='Password'
            bind:value={password}
            class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
          />
          <input
            type='password'
            placeholder='Confirm Password'
            bind:value={passwordConf}
            class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
          />
          <button
            preventdefault:click
            class='cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
            onClick$={async () => {
              loading.value = true

              const res = await validate.submit({
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value,
                password: password.value,
                passwordConf: passwordConf.value,
              })

              if (res.status === 200) {
                activePage.value = 2
              } else {
                toast.error(
                  ParseError(res, [
                    'firstName',
                    'lastName',
                    'email',
                    'password',
                    'passwordConf',
                  ]),
                )
              }

              loading.value = false
            }}
          >
            {loading.value ? <Loading /> : 'Sign up'}
          </button>
        </>
      ) : (
        <div class='mb-[20px] flex w-[calc(60%+20px)] min-w-[270px] max-w-[370px] justify-center'>
          <div class='mb-[20px] flex w-full items-center rounded-[5px] bg-primary p-[10px]'>
            <div class='mr-[2px]'>@</div>
            <input
              type='text'
              placeholder='Username'
              bind:value={username}
              class='w-full placeholder-gray outline-none'
            />
          </div>
          <button
            preventdefault:click
            class='ml-[10px] h-min cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
            onClick$={async () => {
              loading.value = true

              const res1 = await signup.submit({
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value,
                password: password.value,
                passwordConf: passwordConf.value,
                username: username.value,
              })

              if (res1.status === 200) {
                toast.success(ParseSuccess(res1).message)

                const res2 = await login.submit({
                  email: email.value,
                  password: password.value,
                })

                if (res2.status === 200) {
                  await navigate('/')
                } else {
                  toast.error(ParseError(res2, ['email', 'password']))
                }
              } else {
                toast.error(
                  ParseError(res1, [
                    'firstName',
                    'lastName',
                    'email',
                    'password',
                    'passwordConf',
                    'username',
                  ]),
                )
              }

              loading.value = false
            }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke-width='1.5'
              stroke='currentColor'
              class='h-6 w-6'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                d='M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9'
              />
            </svg>
          </button>
        </div>
      )}
    </form>
  )
})
