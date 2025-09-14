// Generate static params for dynamic route
export async function generateStaticParams() {
  // Return empty array for static export
  // Dynamic routes will be handled at runtime
  return []
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

