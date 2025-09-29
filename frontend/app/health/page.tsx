export default function HealthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Frontend Healthy</h1>
        <p className="text-gray-600">{new Date().toISOString()}</p>
      </div>
    </div>
  )
}
