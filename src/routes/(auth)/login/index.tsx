import { component$, useSignal } from '@builder.io/qwik'

export default component$(() => {
  const email = useSignal('')
  const password = useSignal('')

  return (
    <form class='flex h-min min-h-[calc(100vh-130px)] w-full flex-col items-center rounded-[8px] border border-border bg-white px-[20px] py-[40px]'>
      <h1 class='mb-[20px] text-[23px]'>Log In</h1>
      <input
        type='text'
        placeholder='Email'
        bind:value={email}
        class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] outline-none'
      />
      <input
        type='password'
        placeholder='Password'
        bind:value={password}
        class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] outline-none'
      />
      <button
        preventdefault:click
        class='cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
      >
        Log In
      </button>
    </form>
  )
})
