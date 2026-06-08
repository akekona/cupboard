'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Box } from 'lucide-react'

export default function NotFoundPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-[#3B6D11] rounded-xl flex items-center justify-center">
            <Box className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-gray-700">Cupboard</span>
        </div>

        <p className="text-8xl font-bold text-[#C0DD97] leading-none">404</p>

        <div className="space-y-2">
          <h1 className="text-xl font-medium text-gray-900">Page not found</h1>
          <p className="text-sm text-gray-500 max-w-xs">
            The page you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard">
            <button className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] transition-colors">
              Go to dashboard
            </button>
          </Link>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go back
          </button>
        </div>

      </div>
    </div>
  )
}
