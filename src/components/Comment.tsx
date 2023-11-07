import { component$, useSignal } from '@builder.io/qwik'
import { Link, globalAction$, z, zod$ } from '@builder.io/qwik-city'

import { and, eq } from 'drizzle-orm'
import { marked } from 'marked'
import abbreviate from 'number-abbreviate'
import { toast } from 'wc-toast'

import { commentDislikes, commentLikes, comments } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import {
  GenerateError,
  GenerateSuccess,
  GetDb,
  ParseError,
  TimeAgo,
} from '~/components/Utils'

export const GetCommentVotes = async function (comments, db, user) {
  for (let i = 0; i < comments.length; i++) {
    const like = await db.query.commentLikes.findFirst({
      where: and(
        eq(commentLikes.commentId, comments[i].id),
        eq(commentLikes.voter, user.username),
      ),
    })

    const dislike = await db.query.commentDislikes.findFirst({
      where: and(
        eq(commentDislikes.commentId, comments[i].id),
        eq(commentDislikes.voter, user.username),
      ),
    })

    if (like) {
      comments[i].vote = 'liking'
    } else if (dislike) {
      comments[i].vote = 'disliking'
    } else {
      comments[i].vote = 'none'
    }
  }

  return comments
}

export const useLikeComment = globalAction$(
  async (data, requestEvent) => {
    const currentUser = await VerifyAuth(requestEvent)

    if (!currentUser) {
      throw requestEvent.redirect(302, '/login')
    }

    const db = GetDb(requestEvent)

    const comment = await db.query.comments.findFirst({
      columns: {
        id: true,
      },
      where: eq(comments.id, data.id),
    })

    if (!comment) {
      return requestEvent.fail(
        400,
        GenerateError('comment', 'Comment does not exist'),
      )
    }

    const liking = await db.query.commentLikes.findFirst({
      where: and(
        eq(commentLikes.commentId, data.id),
        eq(commentLikes.voter, currentUser.username),
      ),
    })

    await db
      .delete(commentDislikes)
      .where(
        and(
          eq(commentDislikes.commentId, data.id),
          eq(commentDislikes.voter, currentUser.username),
        ),
      )

    if (liking) {
      await db
        .delete(commentLikes)
        .where(
          and(
            eq(commentLikes.commentId, data.id),
            eq(commentLikes.voter, currentUser.username),
          ),
        )
    } else {
      await db.insert(commentLikes).values({
        commentId: data.id,
        voter: currentUser.username,
      })
    }

    return GenerateSuccess()
  },
  zod$({
    id: z.string().trim().uuid(),
  }),
)

export const useDislikeComment = globalAction$(
  async (data, requestEvent) => {
    const currentUser = await VerifyAuth(requestEvent)

    if (!currentUser) {
      throw requestEvent.redirect(302, '/login')
    }

    const db = GetDb(requestEvent)

    const comment = await db.query.comments.findFirst({
      columns: {
        id: true,
      },
      where: eq(comments.id, data.id),
    })

    if (!comment) {
      return requestEvent.fail(
        400,
        GenerateError('comment', 'Comment does not exist'),
      )
    }

    const disliking = await db.query.commentDislikes.findFirst({
      where: and(
        eq(commentLikes.commentId, data.id),
        eq(commentLikes.voter, currentUser.username),
      ),
    })

    await db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.commentId, data.id),
          eq(commentLikes.voter, currentUser.username),
        ),
      )

    if (disliking) {
      await db
        .delete(commentDislikes)
        .where(
          and(
            eq(commentDislikes.commentId, data.id),
            eq(commentDislikes.voter, currentUser.username),
          ),
        )
    } else {
      await db.insert(commentDislikes).values({
        commentId: data.id,
        voter: currentUser.username,
      })
    }

    return GenerateSuccess()
  },
  zod$({
    id: z.string().trim().uuid(),
  }),
)

// Params of type-any for now
export const CommentView = component$(({ preview, comment }: any) => {
  const likeComment = useLikeComment()
  const dislikeComment = useDislikeComment()

  const currentVote = useSignal<'liking' | 'none' | 'disliking'>(comment.vote)
  const voteCount = useSignal(comment.likes.length - comment.dislikes.length)

  return (
    <div class='mb-[20px] w-full rounded-[8px] border border-border bg-white p-[20px]'>
      <div class='flex w-full items-center justify-between'>
        <div class='flex w-full items-center'>
          <Link
            class='cursor-pointer'
            href={'/user/@' + comment.user.username}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              class='h-[55px] w-[55px]'
            >
              <path
                fill-rule='evenodd'
                d='M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'
                clip-rule='evenodd'
              />
            </svg>
          </Link>
          <div class='ml-[5px] flex max-w-[calc(100%-65px)] flex-col'>
            <Link
              class='max-w-full cursor-pointer truncate text-[16px] sm:text-[17px]'
              href={'/user/@' + comment.user.username}
            >
              {comment.user.name}
            </Link>
            <Link
              class='max-w-full cursor-pointer truncate text-[14px] text-gray sm:text-[15px]'
              href={'/user/@' + comment.user.username}
            >
              @{comment.user.username}
            </Link>
          </div>
        </div>
        <div class='flex items-center text-[14px] text-gray sm:text-[15px]'>
          {TimeAgo(comment.createdAt)}
          <button
            preventdefault:click
            class='ml-[5px] cursor-pointer'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke-width='1.5'
              stroke='currentColor'
              class='h-[20px] w-[20px]'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                d='M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z'
              />
            </svg>
          </button>
        </div>
      </div>
      <div class='my-[15px] w-full text-[23px]'>
        <div
          class={'md my-[5px]' + (preview ? ' line-clamp-5' : '')}
          dangerouslySetInnerHTML={marked.parse(comment.content, {
            mangle: false,
            headerIds: false,
          })}
        />
      </div>
      <div class={'flex items-center' + (preview ? ' justify-evenly' : '')}>
        <div class='flex items-center rounded-[5px] bg-primary p-[10px]'>
          <button
            preventdefault:click
            class={
              'cursor-pointer duration-200 hover:text-branding' +
              (currentVote.value === 'liking' ? ' text-branding' : '')
            }
            onClick$={async () => {
              const lastVoteCount = voteCount.value
              const lastVote = currentVote.value

              if (currentVote.value === 'liking') {
                voteCount.value -= 1
                currentVote.value = 'none'
              } else if (currentVote.value === 'none') {
                voteCount.value += 1
                currentVote.value = 'liking'
              } else if (currentVote.value === 'disliking') {
                voteCount.value += 2
                currentVote.value = 'liking'
              }

              const res = await likeComment.submit({ id: comment.id })

              if (res.status !== 200) {
                voteCount.value = lastVoteCount
                currentVote.value = lastVote

                toast.error(ParseError(res, ['id', 'comment']))
              }
            }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              class='h-6 w-6'
            >
              <path d='M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z' />
            </svg>
          </button>
          <div class='mx-[5px]'>{abbreviate(voteCount.value)}</div>
          <button
            preventdefault:click
            class={
              'cursor-pointer duration-200 hover:text-branding' +
              (currentVote.value === 'disliking' ? ' text-branding' : '')
            }
            onClick$={async () => {
              const lastVoteCount = voteCount.value
              const lastVote = currentVote.value

              if (currentVote.value === 'liking') {
                voteCount.value -= 2
                currentVote.value = 'disliking'
              } else if (currentVote.value === 'none') {
                voteCount.value -= 1
                currentVote.value = 'disliking'
              } else if (currentVote.value === 'disliking') {
                voteCount.value += 1
                currentVote.value = 'none'
              }

              const res = await dislikeComment.submit({ id: comment.id })

              if (res.status !== 200) {
                voteCount.value = lastVoteCount
                currentVote.value = lastVote

                toast.error(ParseError(res, ['id', 'comment']))
              }
            }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              class='h-6 w-6'
            >
              <path d='M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 6.748 15H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z' />
            </svg>
          </button>
        </div>
        {preview && (
          <Link
            class='flex cursor-pointer items-center rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
            href={'/post/' + comment.postId + '/comment/' + comment.id}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              class='h-6 w-6'
            >
              <path
                fill-rule='evenodd'
                d='M5.337 21.718a6.707 6.707 0 01-.533-.074.75.75 0 01-.44-1.223 3.73 3.73 0 00.814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 01-4.246.997z'
                clip-rule='evenodd'
              />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
})
