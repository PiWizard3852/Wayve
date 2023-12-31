import { Slot, component$, useSignal, useTask$ } from '@builder.io/qwik'
import {
  Link,
  routeAction$,
  routeLoader$,
  useLocation,
} from '@builder.io/qwik-city'

import { and, eq, ilike } from 'drizzle-orm'
import abbreviate from 'number-abbreviate'
import { toast } from 'wc-toast'

import { followers, users } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import {
  GenerateError,
  GenerateSuccess,
  GetDb,
  ParseError,
} from '~/components/Utils'

export const useFollowUser = routeAction$(async (_, requestEvent) => {
  const username = requestEvent.params.username

  const currentUser = await VerifyAuth(requestEvent)

  if (!currentUser) {
    throw requestEvent.redirect(302, '/login')
  }

  const db = GetDb(requestEvent)

  const possibleUsers = await db.query.users.findMany({
    where: ilike(users.username, username),
    columns: {
      name: true,
      username: true,
      createdAt: true,
    },
    with: {
      followers: true,
      posts: {
        columns: {
          id: true,
        },
      },
      comments: {
        columns: {
          id: true,
        },
      },
    },
  })

  let user

  for (let i = 0; i < possibleUsers.length; i++) {
    if (possibleUsers[0].username.toLowerCase() === username.toLowerCase()) {
      user = possibleUsers[0]
    }
  }

  if (!user) {
    return requestEvent.fail(400, GenerateError('user', 'User does not exist'))
  }

  if (user.username === currentUser.username) {
    return requestEvent.fail(
      400,
      GenerateError('currentUser', 'You cannot follow yourself'),
    )
  }

  const following = await db.query.followers.findFirst({
    where: and(
      eq(followers.followed, user.username),
      eq(followers.follower, currentUser.username),
    ),
  })

  if (following) {
    await db
      .delete(followers)
      .where(
        and(
          eq(followers.followed, user.username),
          eq(followers.follower, currentUser.username),
        ),
      )
  } else {
    await db.insert(followers).values({
      followed: user.username,
      follower: currentUser.username,
    })
  }

  return GenerateSuccess()
})

export const useGetUser = routeLoader$(async (requestEvent) => {
  const currentUser = await VerifyAuth(requestEvent)

  if (!currentUser) {
    throw requestEvent.redirect(302, '/login')
  }

  const username: string = requestEvent.params.username

  const db = GetDb(requestEvent)

  const possibleUsers = await db.query.users.findMany({
    where: ilike(users.username, username),
    columns: {
      name: true,
      username: true,
      createdAt: true,
    },
    with: {
      followers: true,
      posts: {
        columns: {
          id: true,
        },
      },
      comments: {
        columns: {
          id: true,
        },
      },
    },
  })

  let user

  for (let i = 0; i < possibleUsers.length; i++) {
    if (possibleUsers[0].username.toLowerCase() === username.toLowerCase()) {
      user = possibleUsers[0]
    }
  }

  if (!user) {
    return requestEvent.fail(404, {
      response: 'User does not exist',
    })
  }

  const following = await db.query.followers.findFirst({
    where: and(
      eq(followers.followed, user.username),
      eq(followers.follower, currentUser.username),
    ),
  })

  return { ...user, isFollowing: !!following }
})

export default component$(() => {
  const data = useGetUser()
  const user = useSignal(data.value)

  const followUser = useFollowUser()

  const location = useLocation()

  const activePage = useSignal<0 | 1 | 2>(0)
  const followerCount = useSignal(user.value?.followers?.length)
  const following = useSignal(user.value?.isFollowing)

  useTask$(({ track }) => {
    track(() => location.url.pathname)

    if (
      location.url.pathname ===
      '/user/@' + location.params.username + '/posts/'
    ) {
      activePage.value = 1
    } else if (
      location.url.pathname ===
      '/user/@' + location.params.username + '/comments/'
    ) {
      activePage.value = 2
    } else {
      activePage.value = 0
    }
  })

  if (!user.value.username) {
    return <></>
  }

  return (
    <>
      <div class='sticky top-[110px] mb-[20px] w-full rounded-[8px] border border-border bg-white p-[20px] outline outline-[20px] outline-background'>
        <div class='flex w-full items-center justify-between'>
          <div class='flex w-full items-center'>
            <Link
              class='cursor-pointer'
              href={'/user/@' + user.value.username.toLowerCase()}
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
                href={'/user/@' + user.value.username.toLowerCase()}
              >
                <h1>{user.value.name}</h1>
              </Link>
              <Link
                class='max-w-full cursor-pointer truncate text-[14px] text-gray sm:text-[15px]'
                href={'/user/@' + user.value.username.toLowerCase()}
              >
                <h2>@{user.value.username}</h2>
              </Link>
            </div>
          </div>
          <div class='flex items-center text-[14px] sm:text-[15px]'>
            <button
              preventdefault:click
              class='flex w-max cursor-pointer items-center rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
              onClick$={async () => {
                if (following.value) {
                  followerCount.value -= 1
                } else {
                  followerCount.value += 1
                }

                following.value = !following.value

                const res = await followUser.submit()

                if (res.status !== 200) {
                  following.value = !following.value

                  if (following.value) {
                    followerCount.value += 1
                  } else {
                    followerCount.value -= 1
                  }

                  toast.error(ParseError(res, ['user', 'currentUser']))
                }
              }}
            >
              <div class='mr-[5px] text-[15px]'>
                {following.value ? 'Following' : 'Follow'}
              </div>
              <div class='text-[14px] text-gray'>
                {abbreviate(followerCount.value)}
              </div>
            </button>
            <button
              preventdefault:click
              class='ml-[5px] cursor-pointer text-gray'
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
        <div class='mt-[10px] flex w-full justify-evenly'>
          <Link
            class={
              'cursor-pointer ' +
              (activePage.value === 1
                ? 'border-x-0 border-b-[2px] border-t-0 border-solid border-black'
                : 'text-gray duration-200 hover:text-black')
            }
            href={'/user/@' + user.value.username.toLowerCase() + '/posts'}
          >
            Posts
          </Link>
          <Link
            class={
              'cursor-pointer ' +
              (activePage.value === 2
                ? 'border-x-0 border-b-[2px] border-t-0 border-solid border-black'
                : 'text-gray duration-200 hover:text-black')
            }
            href={'/user/@' + user.value.username.toLowerCase() + '/comments'}
          >
            Comments
          </Link>
        </div>
      </div>
      <Slot />
    </>
  )
})
