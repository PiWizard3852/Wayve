import { Slot, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'

import { PostView } from '~/components/Post'

export default component$(() => {
  const post = {
    title: 'Title',
    content: 'Content',
    user: {
      username: 'username',
      name: 'Full Name',
    },
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(),
  }

  const textareaRef = useSignal<Element>()
  const commentContent = useSignal('')

  useVisibleTask$(() => {
    textareaRef.value.addEventListener('input', (e) => {
      e.target.style.height = 'auto'
      e.target.style.height = e.target.scrollHeight - 20 + 'px'
    })
  })

  return (
    <>
      {/*@ts-ignore*/}
      <PostView post={post} />
      <form class='sticky top-[110px] my-[20px] flex w-full items-center rounded-[8px] border border-border bg-white p-[20px] outline outline-[20px] outline-background'>
        <textarea
          ref={textareaRef}
          bind:value={commentContent}
          rows={1}
          placeholder='What do you think?'
          class='w-full whitespace-normal rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
        />
        <button
          preventdefault:click
          class='ml-[10px] cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
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
              d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
            />
          </svg>
        </button>
      </form>
      <Slot />
    </>
  )
})
