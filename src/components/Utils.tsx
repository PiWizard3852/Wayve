import { component$ } from '@builder.io/qwik'
import { RequestEvent, RequestEventAction } from '@builder.io/qwik-city'

import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from '~/db/schema'

export const SortByPopularity = async (PostComments) => {
  const today = new Date().getTime()

  PostComments.sort((a, b) => {
    const aTrend =
      (a.likes.length - a.dislikes.length) /
      (today - new Date(Date.parse(a.createdAt)).getTime())
    const bTrend =
      (b.likes.length - b.dislikes.length) /
      (today - new Date(Date.parse(b.createdAt)).getTime())

    if (aTrend < bTrend) {
      return 1
    } else if (aTrend > bTrend) {
      return -1
    } else {
      return 0
    }
  })

  return PostComments
}

export const SortByRecent = async (PostComments) => {
  PostComments.sort((a, b) => {
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })

  return PostComments
}

export const HashText = async (
  text: string,
  requestEvent: RequestEventAction,
) => {
  const hashUtf8 = new TextEncoder().encode(requestEvent.env.get('AUTH_SECRET'))
  const hashBuffer = await crypto.subtle.digest('SHA-256', hashUtf8)

  const textUtf8 = new TextEncoder().encode(text)

  const alg = { name: 'AES-GCM', iv: hashUtf8 }
  const encryptKey = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    alg,
    false,
    ['encrypt'],
  )

  return Array.from(
    new Uint8Array(await crypto.subtle.encrypt(alg, encryptKey, textUtf8)),
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const ParseError = (res, fields: string[]) => {
  const fieldErrors = res.value.fieldErrors

  for (let i = 0; i < fields.length; i++) {
    if (
      fields[i] in fieldErrors &&
      fieldErrors[fields[i]][0] === 'Fill in all fields'
    ) {
      return 'Fill in all fields'
    }
  }

  for (let i = 0; i < fields.length; i++) {
    if (fields[i] in fieldErrors && fieldErrors[fields[i]][0]) {
      return fieldErrors[fields[i]][0]
    }
  }

  return ''
}

export const ParseSuccess = (res) => {
  return {
    message: res.value.message,
    data: res.value.data,
  }
}

export const GenerateSuccess = (
  message: string = 'Success!',
  data?: object,
) => {
  return {
    failed: false,
    message: message,
    data: data,
  }
}

export const GenerateError = (field: string, message: string) => {
  const error = {
    failed: true,
    fieldErrors: {},
  }

  error.fieldErrors[field] = [message]

  return error
}

export const GetDb = (requestEvent: RequestEventAction | RequestEvent) => {
  neonConfig.fetchConnectionCache = true
  const client = neon(requestEvent.env.get('DATABASE_URL'))

  return drizzle(client, { schema })
}

export const TimeAgo = (input) => {
  const date = Date.parse(input)
  const minute = 60
  const hour = minute * 60
  const day = hour * 24
  const year = day * 365

  const elapsed = Math.floor((Date.now() - date) / 1000)

  if (elapsed < minute) {
    return '0m'
  }

  const a = (elapsed < hour && [Math.floor(elapsed / minute), 'm']) ||
    (elapsed < day && [Math.floor(elapsed / hour), 'h']) ||
    (elapsed < year && [Math.floor(elapsed / day), 'd']) || [
      Math.floor(elapsed / year),
      'y',
    ]

  return `${a[0]}${a[1]}`
}

export const Loading = component$(() => {
  return (
    <>
      <svg
        aria-hidden='true'
        class='h-[24px] w-[24px] animate-spin fill-branding text-gray'
        viewBox='0 0 100 101'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
          fill='currentColor'
        />
        <path
          d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
          fill='currentFill'
        />
      </svg>
      <span class='sr-only'>Loading...</span>
    </>
  )
})
