import React from 'react'
import { SignIn } from "@clerk/nextjs";

function login() {
  return (
    <main className="p-4 pl-20 w-full h-screen bg-[#252525]">
        <div className='mx-96 px-20 py-24'>
        <SignIn signUpUrl='/signup'/>
        </div>
    </main>
  )
}

export default login