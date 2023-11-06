import { Slot, component$ } from '@builder.io/qwik'
import { Link, RequestHandler } from '@builder.io/qwik-city'

import Logo from '~/logo.png?jsx'

import { VerifyAuth } from '~/components/Auth'

export const onGet: RequestHandler = async (requestEvent) => {
  requestEvent.cacheControl({
    staleWhileRevalidate: 60 * 60 * 24,
    maxAge: 5,
  })

  const currentUser = await VerifyAuth(requestEvent)

  if (currentUser) {
    throw requestEvent.redirect(302, '/')
  }
}

export default component$(() => {
  return (
    <div class='flex flex-col items-center p-[20px]'>
      <header class='sticky left-[20px] top-[20px] z-10 mb-[20px] flex h-[70px] w-full items-center justify-between rounded-[8px] border border-border bg-white px-[20px] outline outline-[20px] outline-background'>
        <Link
          href='/'
          class='cursor-pointer'
        >
          <Logo
            alt='Wayve'
            class='h-[55px] w-[55px]'
          />
        </Link>
        <div class='flex items-center'>
          <Link
            href='/login'
            class='mr-[10px] cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
          >
            Login
          </Link>
          <Link
            href='/signup'
            class='mr-[10px] cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
          >
            Signup
          </Link>
        </div>
      </header>
      <Slot />
    </div>
  )
})
