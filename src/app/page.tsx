import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center max-w-lg px-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
          K
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">kidsAI</h1>
        <p className="text-lg text-gray-600 mb-2">
          AI that builds thinkers, not answer-seekers.
        </p>
        <p className="text-gray-500 mb-8">
          A safe AI learning coach for kids and young learners. SeanSean won&apos;t give your child answers
          — he&apos;ll help them figure things out themselves.
        </p>


        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition text-center"
          >
            Get Started (Parent)
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition text-center"
          >
            Log In
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl mb-1">🧠</div>
            <p className="text-sm text-gray-600 font-medium">Builds thinking skills</p>
          </div>
          <div>
            <div className="text-2xl mb-1">🛡️</div>
            <p className="text-sm text-gray-600 font-medium">Safe for kids</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📊</div>
            <p className="text-sm text-gray-600 font-medium">Parents see progress</p>
          </div>
        </div>
      </div>
    </div>
  );
}
