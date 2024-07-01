import { SignUp } from '@clerk/nextjs'
import React from 'react'

function signup() {
  return (
    <main className="p-4 pl-20 w-full h-screen bg-[#252525]">
        <div className='mx-96 px-20 py-20'>
        <SignUp afterSignInUrl='/login'/>
        </div>
    </main>
  )
}

export default signup