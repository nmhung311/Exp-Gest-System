export default function DebugPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Debug Background</h1>
        <p className="text-lg mb-8">Kiểm tra background neon</p>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold mb-2">Test Card</h2>
          <p className="text-gray-300">Nếu bạn thấy gradient màu cam, tím, xanh thì đã hoạt động!</p>
        </div>
      </div>
    </div>
  )
}
