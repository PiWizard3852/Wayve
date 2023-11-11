import { component$, useSignal } from '@builder.io/qwik'
import { globalAction$, z, zod$ } from '@builder.io/qwik-city'

import { eq, ilike } from 'drizzle-orm'
import { Resend } from 'resend'
import { toast } from 'wc-toast'

import { users, verifications } from '~/db/schema'

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
      .min(1, { message: 'Fill in all fields' })
      .max(90, { message: 'First name exceeds character limit' }),
    lastName: z
      .string()
      .trim()
      .min(1, { message: 'Fill in all fields' })
      .max(90, { message: 'Last name exceeds character limit' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, { message: 'Fill in all fields' })
      .email({ message: 'Enter a valid email' })
      .max(180, { message: 'Email name exceeds character limit' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(60, { message: 'Password exceeds character limit' }),
    passwordConf: z.string().min(1, { message: 'Fill in all fields' }),
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

    return GenerateSuccess('Account successfully created!')
  },
  zod$({
    firstName: z
      .string()
      .trim()
      .min(1, { message: 'Fill in all fields' })
      .max(90, { message: 'First name exceeds character limit' }),
    lastName: z
      .string()
      .trim()
      .min(1, { message: 'Fill in all fields' })
      .max(90, { message: 'Last name exceeds character limit' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, { message: 'Fill in all fields' })
      .email({ message: 'Enter a valid email' })
      .max(180, { message: 'Email name exceeds character limit' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(60, { message: 'Password exceeds character limit' }),
    passwordConf: z.string().min(1, { message: 'Fill in all fields' }),
    username: z
      .string()
      .trim()
      .min(1, { message: 'Fill in all fields' })
      .max(50, { message: 'Username exceeds character limit' }),
  }),
)

export const useChangeEmail = globalAction$(
  async (data, requestEvent) => {
    const db = await GetDb(requestEvent)

    const emailTaken = await db.query.users.findFirst({
      columns: {
        username: true,
      },
      where: eq(users.email, data.newEmail),
    })

    if (emailTaken) {
      return requestEvent.fail(
        400,
        GenerateError('email', 'Email is already in use'),
      )
    }

    await db
      .update(users)
      .set({
        email: data.newEmail,
      })
      .where(eq(users.email, data.email))

    await db.delete(verifications).where(eq(verifications.email, data.email))

    return GenerateSuccess('Email successfully updated!')
  },
  zod$({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, { message: 'Fill in all fields' })
      .email({ message: 'Enter a valid email' })
      .max(180, { message: 'Email name exceeds character limit' }),
    newEmail: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, { message: 'Fill in all fields' })
      .email({ message: 'Enter a valid email' })
      .max(180, { message: 'Email name exceeds character limit' }),
  }),
)

export const useConfirmEmail = globalAction$(
  async (data, requestEvent) => {
    const db = await GetDb(requestEvent)

    const userExists = await db.query.users.findFirst({
      columns: {
        username: true,
      },
      where: eq(users.email, data.email),
    })

    if (!userExists) {
      return requestEvent.fail(
        400,
        GenerateError('email', 'User does not exist'),
      )
    }

    const verification = await db
      .insert(verifications)
      .values({
        email: data.email,
      })
      .returning()

    const resend = new Resend(requestEvent.env.get('SMTP_KEY'))

    try {
      await resend.emails.send({
        from: `Wayve <${requestEvent.env.get('SMTP_EMAIL')}>`,
        to: [data.email],
        subject: 'Verify your email',
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><meta http-equiv="Content-Type" content="text/html charset=UTF-8"><html lang="en"><head><style>@import url(https://fonts.googleapis.com/css2?family=Montserrat);</style></head><body style="background-color:#fff;font-family:Montserrat,sans-serif;font-weight:500"><table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:37.5em;margin:0 auto;padding:20px 0 48px"><tr style="width:100%"><td><img alt="Wayve" src="https://wayve.owenwood.tech/logo.png" width="64" height="64" style="display:block;outline:0;border:none;text-decoration:none;margin:0 auto"><p style="font-size:16px;line-height:26px;margin:16px 0">Hi ${
          data.firstName
        } ${
          data.lastName
        },</p><p style="font-size:16px;line-height:26px;margin:16px 0">Welcome to Wayve! Click the link below to confirm your email.</p><table style="text-align:center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td><a href="${requestEvent.env.get(
          'HOST_URL',
        )}/verify/${
          verification[0].id
        }" target="_blank" style="background-color:#f5f5f5;border-radius:5px;color:#000;font-size:16px;text-decoration:none;text-align:center;display:inline-block;p-x:10px;p-y:10px;line-height:100%;max-width:100%;padding:12px 12px"><span></span><span style="background-color:#f5f5f5;border-radius:3px;color:#000;font-size:16px;text-decoration:none;text-align:center;display:inline-block;p-x:12px;p-y:12px;max-width:100%;line-height:120%;text-transform:none;mso-padding-alt:0;mso-text-raise:9px">Get started</span><span></span></a></td></tr></tbody></table><p style="font-size:16px;line-height:26px;margin:16px 0">Best,<br>The Wayve team</p><hr style="width:100%;border:none;border-top:1px solid #efefef;border-color:#efefef;margin:20px 0"><p style="font-size:16px;line-height:26px;margin:16px 0">If you did not sign up, you can ignore this email</p></td></tr></table></body></html>`,
        tags: [
          {
            name: 'category',
            value: 'confirm_email',
          },
        ],
      })
    } catch {
      return requestEvent.fail(
        400,
        GenerateError('email', 'Email could not be sent'),
      )
    }

    return GenerateSuccess()
  },
  zod$({
    firstName: z
      .string()
      .trim()
      .min(1, { message: 'Fill in all fields' })
      .max(90, { message: 'First name exceeds character limit' }),
    lastName: z
      .string()
      .trim()
      .min(1, { message: 'Fill in all fields' })
      .max(90, { message: 'Last name exceeds character limit' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, { message: 'Fill in all fields' })
      .email({ message: 'Enter a valid email' })
      .max(180, { message: 'Email name exceeds character limit' }),
  }),
)

export default component$(() => {
  const validate = useValidate()
  const signup = useSignup()
  const changeEmail = useChangeEmail()
  const confirmEmail = useConfirmEmail()

  const loading = useSignal(false)
  const activePage = useSignal<1 | 2 | 3 | 4>(1)

  const firstName = useSignal('')
  const lastName = useSignal('')
  const email = useSignal('')
  const password = useSignal('')
  const passwordConf = useSignal('')
  const username = useSignal('')

  const newEmail = useSignal('')

  if (activePage.value === 1) {
    return (
      <form class='flex h-min min-h-[calc(100vh-130px)] w-full flex-col items-center rounded-[8px] border border-border bg-white px-[20px] py-[40px]'>
        <h1 class='mb-[20px] text-[23px]'>Sign Up</h1>
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
          disabled={loading.value}
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
      </form>
    )
  }

  if (activePage.value === 2) {
    return (
      <form class='flex h-min min-h-[calc(100vh-130px)] w-full flex-col items-center rounded-[8px] border border-border bg-white px-[20px] py-[40px]'>
        <h1 class='mb-[20px] text-[23px]'>Choose a Username</h1>
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
            disabled={loading.value}
            onClick$={async () => {
              loading.value = true

              const res = await signup.submit({
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value,
                password: password.value,
                passwordConf: passwordConf.value,
                username: username.value,
              })

              if (res.status === 200) {
                toast.success(ParseSuccess(res).message)

                const emailRes = await confirmEmail.submit({
                  firstName: firstName.value,
                  lastName: lastName.value,
                  email: email.value,
                })

                if (emailRes.status === 200) {
                  activePage.value = 4
                } else {
                  toast.error(
                    ParseError(emailRes, ['firstName', 'lastName', 'email']),
                  )
                }
              } else {
                toast.error(
                  ParseError(res, [
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
            {loading.value ? (
              <Loading />
            ) : (
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
            )}
          </button>
        </div>
      </form>
    )
  }

  if (activePage.value === 3) {
    return (
      <form class='flex h-min min-h-[calc(100vh-130px)] w-full flex-col items-center rounded-[8px] border border-border bg-white px-[20px] py-[40px]'>
        <h1 class='mb-[20px] text-[23px]'>Change your email</h1>
        <div class='mb-[20px] flex w-[calc(60%+20px)] min-w-[270px] max-w-[370px] justify-center'>
          <input
            type='text'
            placeholder='Email'
            bind:value={newEmail}
            class='mb-[20px] flex w-full items-center rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
          />
          <button
            preventdefault:click
            class='ml-[10px] h-min cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
            disabled={loading.value}
            onClick$={async () => {
              loading.value = true

              const res = await changeEmail.submit({
                email: email.value,
                newEmail: newEmail.value,
              })

              if (res.status === 200) {
                const emailRes = await confirmEmail.submit({
                  firstName: firstName.value,
                  lastName: lastName.value,
                  email: newEmail.value,
                })

                if (emailRes.status === 200) {
                  activePage.value = 4
                } else {
                  toast.error(
                    ParseError(emailRes, ['firstName', 'lastName', 'email']),
                  )
                }
              } else {
                toast.error(ParseError(res, ['email', 'username']))
              }

              loading.value = false
            }}
          >
            {loading.value ? (
              <Loading />
            ) : (
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
            )}
          </button>
        </div>
      </form>
    )
  }

  if (activePage.value === 4) {
    return (
      <div class='flex h-min min-h-[calc(100vh-130px)] w-full flex-col items-center rounded-[8px] border border-border bg-white px-[20px] py-[40px]'>
        <h1 class='text-center text-[23px]'>Please confirm your email</h1>
        <p class='text-center'>
          A link was sent to{' '}
          {newEmail.value !== '' ? newEmail.value : email.value}
        </p>
        <div class='flex w-[300px] justify-between p-[10px] text-center'>
          <button
            class='cursor-pointer rounded rounded-[5px] bg-background p-[10px] duration-200 hover:text-branding'
            onClick$={async () => {
              loading.value = true

              const res = await confirmEmail.submit({
                firstName: firstName.value,
                lastName: lastName.value,
                email: newEmail.value !== '' ? newEmail.value : email.value,
              })

              if (res.status === 200) {
                toast.success(ParseSuccess(res).message)
              } else {
                toast.error(ParseError(res, ['firstName', 'lastName', 'email']))
              }

              loading.value = false
            }}
          >
            {loading.value ? <Loading /> : 'Resend link'}
          </button>
          <button
            class='cursor-pointer rounded rounded-[5px] bg-background p-[10px] duration-200 hover:text-branding'
            onClick$={() => {
              activePage.value = 3
            }}
          >
            Edit email
          </button>
        </div>
      </div>
    )
  }
})
