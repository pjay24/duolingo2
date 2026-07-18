"use client";

/**
 * Central place for the assignment's "Mocked / Placeholder Sections":
 *   - Real speech recognition / pronunciation exercises
 *   - In-app purchases / Super subscription (gems can be mocked)
 *   - Friends / social features (leaderboard can be seeded)
 *   - Multiple languages (one seeded language is enough)
 *   - Real user authentication (simplified — default logged-in learner)
 *
 * Keeping the copy here means every entry point (Settings, Leaderboard,
 * TopBar, lesson player, etc.) renders the exact same wording/icon for a
 * given feature instead of drifting out of sync.
 */
export interface MockedFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export const MOCKED_FEATURES: MockedFeature[] = [
  {
    id: "pronunciation",
    icon: "🎙️",
    title: "Pronunciation Practice",
    description: "Real speech recognition to score how you say each word.",
  },
  {
    id: "super",
    icon: "💎",
    title: "Super Subscription",
    description: "Unlimited hearts, no ads, and in-app gem purchases.",
  },
  {
    id: "friends",
    icon: "👥",
    title: "Friends & Social",
    description: "Follow friends and compete together on quests.",
  },
  {
    id: "languages",
    icon: "🌍",
    title: "More Languages",
    description: "French, Japanese, German and more courses to learn.",
  },
  {
    id: "auth",
    icon: "🔐",
    title: "Account Sign-In",
    description: "Sign in with Google/Apple to sync progress across devices.",
  },
];

/**
 * Small inline pill, e.g. next to a nav label or stat: "Coming Soon".
 */
export function ComingSoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap text-[10px] font-extrabold uppercase tracking-wide
        text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full ${className}`}
    >
      Coming Soon
    </span>
  );
}

/**
 * A single feature card — icon, title, description, badge. Stacks full-width
 * on mobile and sits in a grid on larger screens (see MockedFeaturesSection).
 */
export function ComingSoonCard({ icon, title, description }: Omit<MockedFeature, "id">) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700
        bg-gray-50 dark:bg-gray-800/60 p-4 opacity-90 transition-colors h-full"
    >
      <span className="text-2xl leading-none flex-shrink-0" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-extrabold text-gray-600 dark:text-gray-300 text-sm">{title}</p>
          <ComingSoonBadge />
        </div>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * Full responsive section listing every mocked/placeholder feature.
 * 1 column on mobile, 2 on tablet+, so it never feels cramped or sparse.
 */
export function MockedFeaturesSection({
  title = "Coming Soon",
  subtitle = "These features are placeholders for this project.",
  features = MOCKED_FEATURES,
}: {
  title?: string;
  subtitle?: string;
  features?: MockedFeature[];
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs font-bold text-gray-400 px-1 mb-3">{subtitle}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((feature) => (
          <ComingSoonCard
            key={feature.id}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </div>
  );
}

export default MockedFeaturesSection;
