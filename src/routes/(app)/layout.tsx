import {
  $,
  Slot,
  component$,
  useOnWindow,
  useSignal,
  useTask$,
} from '@builder.io/qwik'
import { Link, RequestHandler, useLocation } from '@builder.io/qwik-city'

import Logo from '~/logo.png?jsx'

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({
    staleWhileRevalidate: 60 * 60 * 24,
    maxAge: 5,
  })
}

export default component$(() => {
  const activePage = useSignal<0 | 1 | 2 | 3 | 4>()
  const navActive = useSignal(false)
  const profileActive = useSignal(false)

  const location = useLocation()

  useOnWindow(
    'resize',
    $(() => {
      navActive.value = false
      profileActive.value = false
    }),
  )

  useTask$(({ track }) => {
    track(() => location.url.pathname)

    if (location.url.pathname === '/') {
      activePage.value = 1
    } else if (location.url.pathname === '/saved/') {
      activePage.value = 2
    } else if (location.url.pathname === '/messages/') {
      activePage.value = 3
    } else if (location.url.pathname === '/notifications/') {
      activePage.value = 4
    } else {
      activePage.value = 0
    }
  })

  return (
    <div class='p-[20px] pb-0'>
      <header class='sticky left-[20px] top-[20px] z-10 mb-[20px] flex h-[70px] w-full items-center justify-between rounded-[8px] border border-border bg-white px-[20px] outline outline-[20px] outline-background'>
        <Link
          href='/'
          class='hidden cursor-pointer sm:inline'
        >
          <Logo
            alt='Wayve'
            class='h-[55px] w-[55px]'
          />
        </Link>
        <button
          preventdefault:click
          class='cursor-pointer rounded-[5px] p-[10px] text-[20px] duration-200 hover:bg-primary sm:hidden'
          onClick$={() => {
            navActive.value = !navActive.value
          }}
        >
          {!navActive.value ? (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke-width='1.5'
              stroke='currentColor'
              class='m-auto h-6 w-6'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
              />
            </svg>
          ) : (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke-width='1.5'
              stroke='currentColor'
              class='m-auto h-6 w-6'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          )}
        </button>
        <div class='flex w-[calc(100%-60px)] items-center justify-end sm:w-[calc(100%-80px)] lg:w-[calc(100%-330px)]'>
          <form
            class={
              'm-auto h-[45px] w-full min-w-[200px] max-w-[700px] items-center rounded-[5px] bg-primary p-[10px] sm:flex sm:w-[70%] ' +
              (!navActive.value ? 'hidden' : 'flex')
            }
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke-width='1.5'
              stroke='currentColor'
              class='mr-[5px] h-[20px] w-[20px] text-gray'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z'
              />
            </svg>
            <input
              type='text'
              placeholder='Search'
              class='w-[calc(100%-20px)] placeholder-gray outline-none'
            />
          </form>
          {!navActive.value && (
            <>
              <Link
                href='/create'
                class='mr-[10px] cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
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
                    d='M12 4.5v15m7.5-7.5h-15'
                  />
                </svg>
              </Link>
              <button
                preventdefault:click
                class={
                  'cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding' +
                  (profileActive ? ' z-30' : '')
                }
                onClick$={() => {
                  profileActive.value = !profileActive.value
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
                    d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                  />
                </svg>
              </button>
              {profileActive.value && (
                <>
                  <div
                    class='fixed left-0 top-0 z-20 h-[100vh] w-[100vw] bg-black/10'
                    onClick$={() => {
                      profileActive.value = false
                    }}
                  />
                  <div class='absolute right-0 top-[90px] z-30 rounded-[8px] border border-border bg-white p-[20px] p-[20px]'>
                    <Link
                      href='/user/@wodicode'
                      class='mb-[20px] flex cursor-pointer items-center rounded-[5px] p-[10px] text-[20px] duration-200 hover:bg-primary hover:text-branding'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke-width='1.5'
                        stroke='currentColor'
                        class='mr-[10px] h-[30px] w-[30px]'
                      >
                        <path
                          stroke-linecap='round'
                          stroke-linejoin='round'
                          d='M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                      </svg>
                      <div class='inline'>Profile</div>
                    </Link>
                    <button
                      preventdefault:click
                      class='flex cursor-pointer items-center rounded-[5px] p-[10px] text-[20px] duration-200 hover:bg-primary hover:text-branding'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke-width='1.5'
                        stroke='currentColor'
                        class='mr-[10px] h-[30px] w-[30px]'
                      >
                        <path
                          stroke-linecap='round'
                          stroke-linejoin='round'
                          d='M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75'
                        />
                      </svg>
                      <div class='inline'>Logout</div>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </header>
      <div class='flex'>
        <aside
          class={
            'sticky left-[20px] top-[110px] h-[calc(100vh-130px)] w-full overflow-y-scroll rounded-[8px] border border-border bg-white p-[20px] sm:mr-[20px] sm:inline sm:w-min lg:w-[335px] ' +
            (navActive.value ? 'inline' : 'hidden')
          }
        >
          <nav>
            <ul>
              <li>
                <Link
                  href='/'
                  class={
                    'mb-[20px] flex cursor-pointer items-center rounded-[5px] p-[10px] text-[20px] ' +
                    (activePage.value === 1
                      ? 'bg-primary text-branding'
                      : 'duration-200 hover:bg-primary hover:text-branding')
                  }
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke-width='1.5'
                    stroke='currentColor'
                    class='mr-[20px] h-[35px] w-[35px] sm:mr-0 lg:mr-[20px]'
                  >
                    <path
                      stroke-linecap='round'
                      stroke-linejoin='round'
                      d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
                    />
                  </svg>
                  <div class='sm:hidden lg:inline'>Home</div>
                </Link>
              </li>
              <li>
                <Link
                  href='/saved'
                  class={
                    'mb-[20px] flex cursor-pointer items-center rounded-[5px] p-[10px] text-[20px] ' +
                    (activePage.value === 2
                      ? 'bg-primary text-branding'
                      : 'duration-200 hover:bg-primary hover:text-branding')
                  }
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke-width='1.5'
                    stroke='currentColor'
                    class='mr-[20px] h-[35px] w-[35px] sm:mr-0 lg:mr-[20px]'
                  >
                    <path
                      stroke-linecap='round'
                      stroke-linejoin='round'
                      d='M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z'
                    />
                  </svg>
                  <div class='sm:hidden lg:inline'>Saved</div>
                </Link>
              </li>
              <li>
                <Link
                  href='/messages'
                  class={
                    'mb-[20px] flex cursor-pointer items-center rounded-[5px] p-[10px] text-[20px] ' +
                    (activePage.value === 3
                      ? 'bg-primary text-branding'
                      : 'duration-200 hover:bg-primary hover:text-branding')
                  }
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke-width='1.5'
                    stroke='currentColor'
                    class='mr-[20px] h-[35px] w-[35px] sm:mr-0 lg:mr-[20px]'
                  >
                    <path
                      stroke-linecap='round'
                      stroke-linejoin='round'
                      d='M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z'
                    />
                  </svg>
                  <div class='sm:hidden lg:inline'>Messages</div>
                </Link>
              </li>
              <li>
                <Link
                  href='/notifications'
                  class={
                    'mb-[20px] flex cursor-pointer items-center rounded-[5px] p-[10px] text-[20px] ' +
                    (activePage.value === 4
                      ? 'bg-primary text-branding'
                      : 'duration-200 hover:bg-primary hover:text-branding')
                  }
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke-width='1.5'
                    stroke='currentColor'
                    class='mr-[20px] h-[35px] w-[35px] sm:mr-0 lg:mr-[20px]'
                  >
                    <path
                      stroke-linecap='round'
                      stroke-linejoin='round'
                      d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
                    />
                  </svg>
                  <div class='sm:hidden lg:inline'>Notifications</div>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        <main
          class={
            'sm:w-[calc(100%-90px)] lg:w-[calc(100%-350px)] ' +
            (navActive.value ? 'h-0 w-0' : 'w-full')
          }
        >
          {!navActive.value && <Slot />}
        </main>
      </div>
    </div>
  )
})
