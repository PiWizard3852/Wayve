import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeAction$, useNavigate, z, zod$ } from '@builder.io/qwik-city'

import { toast } from 'wc-toast'

import { posts } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import {
  GenerateError,
  GenerateSuccess,
  GetDb,
  Loading,
  ParseError,
  ParseSuccess,
} from '~/components/Utils'

export const useCreatePost = routeAction$(
  async (data, requestEvent) => {
    const currentUser = await VerifyAuth(requestEvent)

    if (!currentUser) {
      return requestEvent.fail(
        400,
        GenerateError('currentUser', 'Unauthorized'),
      )
    }

    const contentTrim = data.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim()

    if (contentTrim === '') {
      return requestEvent.fail(
        400,
        GenerateError('content', 'Fill in all fields'),
      )
    }

    const db = GetDb(requestEvent)

    const post = await db
      .insert(posts)
      .values({
        title: data.title.trim(),
        content: contentTrim,
        username: currentUser.username,
      })
      .returning()

    return GenerateSuccess('Post published successfully!', post[0])
  },
  zod$({
    title: z
      .string()
      .trim()
      .min(1, { message: 'Fill in all fields' })
      .max(80, { message: 'Title exceeds character limit' }),
    content: z
      .string()
      .trim()
      .min(1, { message: 'Fill in all fields' })
      .max(500, { message: 'Content exceeds character limit' }),
  }),
)

export default component$(() => {
  const createPost = useCreatePost()

  const loading = useSignal(false)

  const textareaRef = useSignal<Element>()
  const title = useSignal('')
  const content = useSignal('')

  const navigate = useNavigate()

  useVisibleTask$(() => {
    textareaRef.value.addEventListener('input', (e) => {
      e.target.style.height = 'auto'
      e.target.style.height = e.target.scrollHeight - 20 + 'px'
    })
  })

  return (
    <form class='mb-[20px] flex w-full flex-col rounded-[8px] border border-border bg-white p-[20px]'>
      <div class='mb-[10px] flex w-full'>
        <textarea
          cols={1}
          placeholder='Title your post'
          bind:value={title}
          class='h-[24px] w-full whitespace-nowrap rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
        />
        <button
          preventdefault:click
          class='ml-[10px] cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
          disabled={loading.value}
          onClick$={async () => {
            if (!loading.value) {
              loading.value = true

              const res = await createPost.submit({
                title: title.value,
                content: content.value,
              })

              if (res.status !== 200) {
                toast.error(
                  ParseError(res, ['currentUser', 'title', 'content']),
                )
              } else {
                toast.success(ParseSuccess(res).message)
                title.value = ''
                content.value = ''
                setTimeout(() => navigate(`/post/${ParseSuccess(res).data.id}`))
              }

              loading.value = false
            }
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
                d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
              />
            </svg>
          )}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        bind:value={content}
        rows={10}
        placeholder='What&#039;s on your mind?'
        class='whitespace-pre-line rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
      />
    </form>
  )
})
