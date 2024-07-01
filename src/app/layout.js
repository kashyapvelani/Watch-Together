// import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from '@clerk/themes';


// const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Watch Together',
  description: 'Watch Movies Together with Friends',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{
      baseTheme: dark,
      variables: { colorPrimary: 'blue' },
    }}>
    <html lang="en">
      <body>
        <Navbar/>
        {children}
        </body>
    </html>
    </ClerkProvider>
  )
}
