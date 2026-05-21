import { Metadata } from "next"
import Image from "next/image"
import { Command } from "lucide-react"

export const metadata: Metadata = {
  title: "Authentication - Finance Management System",
  description: "Secure login and registration for the finance management system.",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex border-r border-zinc-800 overflow-hidden bg-black">
        
        <div className="relative z-20 flex items-center text-lg font-medium drop-shadow-md">
          <Command className="mr-2 h-6 w-6 text-white" />
          <span className="font-bold text-white">
            Finance Management System
          </span>
        </div>
        
        <div className="relative z-10 flex flex-1 items-center justify-center w-full">
          <div className="relative w-full max-w-sm aspect-square opacity-90 transition-opacity hover:opacity-100">
            <Image 
              src="/finance-art.png" 
              alt="Finance Art" 
              fill 
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed tracking-wide text-zinc-300">
              &ldquo;This finance management system has completely transformed how our team handles budgets and proposals, saving us countless hours every month.&rdquo;
            </p>
            <footer className="text-sm font-medium text-zinc-400 mt-4">
              Sofia Davis, <span className="text-zinc-500">Chief Financial Officer</span>
            </footer>
          </blockquote>
        </div>
      </div>
      <div className="p-8 h-full flex items-center">
        {children}
      </div>
    </div>
  )
}
