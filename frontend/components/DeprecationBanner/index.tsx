import { useState } from "react";

export const DeprecationBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-orange text-neutral-black text-center py-2 px-4 text-sm font-mono font-medium flex items-center justify-center gap-2">
      <span>
        Lens Protocol v1 API has been deprecated. This app is running on mock
        data only.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 text-orange-800 hover:text-neutral-black font-bold text-lg leading-none"
        aria-label="Dismiss banner"
      >
        &times;
      </button>
    </div>
  );
};
