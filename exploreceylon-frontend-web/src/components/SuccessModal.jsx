export function SuccessModal({
  isOpen,
  title,
  message,
  offerText,
  offerCode,
  buttonText = "Start Exploring",
  onButtonClick,
  onClose,
  icon = "🌿",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 transition hover:text-slate-600"
        >
          ✕
        </button>

        <div className="space-y-6 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl">
            {icon}
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="text-base text-slate-600">{message}</p>
          </div>

          {offerText && offerCode && (
            <div className="rounded-2xl bg-emerald-50 px-5 py-4">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">🎁 {offerText}</span>
              </p>
              <p className="mt-2 inline-block rounded-lg bg-white px-3 py-1 font-mono text-sm font-bold text-emerald-700">
                {offerCode}
              </p>
            </div>
          )}

          <button
            onClick={onButtonClick}
            className="w-full rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}