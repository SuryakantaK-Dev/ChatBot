export default function WissenLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center space-x-2`}>
      <div className="bg-blue-600 rounded-lg w-8 h-8 flex items-center justify-center">
        <span className="text-white font-bold text-lg">W</span>
      </div>
      <span className="text-lg font-semibold text-gray-900">WISSEN</span>
    </div>
  );
}