import { Slot, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import {
  routeAction$,
  routeLoader$,
  useNavigate,
  z,
  zod$,
} from '@builder.io/qwik-city'

import { eq } from 'drizzle-orm'
import { toast } from 'wc-toast'

import { comments, posts } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import { GetPostVote, PostView } from '~/components/Post'
import {
  GenerateError,
  GenerateSuccess,
  GetDb,
  Loading,
  ParseError,
  ParseSuccess,
} from '~/components/Utils'

export const useCreateComment = routeAction$(
  async (data, requestEvent) => {
    const postId = requestEvent.params.postId

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

    const comment = await db
      .insert(comments)
      .values({
        content: contentTrim,
        username: currentUser.username,
        postId: postId,
      })
      .returning()

    return GenerateSuccess('Post published successfully!', comment[0])
  },
  zod$({
    content: z
      .string()
      .trim()
      .nonempty({ message: 'Fill in all fields' })
      .max(500, { message: 'Title exceeds character limit' }),
  }),
)

export const useGetPost = routeLoader$(async (requestEvent) => {
  const postId = requestEvent.params.postId

  const currentUser = await VerifyAuth(requestEvent)

  if (!currentUser) {
    throw requestEvent.redirect(302, '/login')
  }

  const db = GetDb(requestEvent)

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
    },
    with: {
      user: {
        columns: {
          name: true,
          username: true,
        },
      },
      comments: {
        columns: {
          id: true,
        },
      },
      likes: true,
      dislikes: true,
    },
  })

  if (!post) {
    return requestEvent.fail(404, {
      response: 'Post does not exist',
    })
  }

  return (await GetPostVote([post], db, currentUser))[0]
})

export default component$(() => {
  const post = useGetPost()

  const createComment = useCreateComment()

  const navigate = useNavigate()

  const loading = useSignal(false)

  const textareaRef = useSignal<Element>()
  const content = useSignal('')

  useVisibleTask$(() => {
    textareaRef.value.addEventListener('input', (e) => {
      e.target.style.height = 'auto'
      e.target.style.height = e.target.scrollHeight - 20 + 'px'
    })
  })

  if (!post.value.id) {
    return <div ref={textareaRef} />
  }

  return (
    <>
      {/*@ts-ignore*/}
      <PostView post={post.value} />
      <form class='sticky top-[110px] my-[20px] flex w-full items-center rounded-[8px] border border-border bg-white p-[20px] outline outline-[20px] outline-background'>
        <textarea
          ref={textareaRef}
          bind:value={content}
          rows={1}
          placeholder='What do you think?'
          class='w-full whitespace-normal rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
        />
        <button
          preventdefault:click
          class='ml-[10px] cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
          disabled={loading.value}
          onClick$={async () => {
            if (!loading.value) {
              loading.value = true

              const res = await createComment.submit({
                content: content.value,
              })

              if (res.status !== 200) {
                toast.error(
                  ParseError(res, ['currentUser', 'title', 'content']),
                )
              } else {
                toast.success(ParseSuccess(res).message)
                content.value = ''
                await navigate(
                  '/post/' +
                    ParseSuccess(res).data.postId +
                    '/comment/' +
                    ParseSuccess(res).data.id,
                )
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
      </form>
      <Slot />
    </>
  )
})
