export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <span className="text-3xl font-bold text-primary-foreground">L</span>
            </div>
            <h1 className="text-3xl font-bold">Lithic Healthcare</h1>
            <p className="mt-2 text-muted-foreground">
              Enterprise Healthcare Management Platform
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
