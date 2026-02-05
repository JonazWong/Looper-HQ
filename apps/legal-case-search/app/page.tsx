export default function HomePage() {
  return (
    <main className="min-h-screen bg-premier-black">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-gradient-gold">Legal Case Search</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Hong Kong Legal Case Management Platform
          </p>
          <div className="glass-card-dark rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-premier-gold mb-4">
              Welcome to Legal Case Search
            </h2>
            <p className="text-gray-400 mb-6">
              Unified legal case management and inquiry platform for Hong Kong legal professionals.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="font-semibold text-premier-gold-light mb-2">Case Management</h3>
                <p className="text-sm text-gray-400">Manage your legal cases efficiently</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="font-semibold text-premier-gold-light mb-2">Client Portal</h3>
                <p className="text-sm text-gray-400">Connect with your clients</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="font-semibold text-premier-gold-light mb-2">Time Tracking</h3>
                <p className="text-sm text-gray-400">Track billable hours</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="font-semibold text-premier-gold-light mb-2">Document Management</h3>
                <p className="text-sm text-gray-400">Organize case documents</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
