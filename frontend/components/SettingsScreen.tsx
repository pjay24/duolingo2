"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "./ToastProvider";
import { isSoundEnabled, setSoundEnabled as persistSoundEnabled, playCorrect } from "@/lib/sound";
import { MockedFeaturesSection, ComingSoonBadge } from "./ComingSoonBanner";

const GOAL_OPTIONS = [10, 20, 30, 50];

export default function SettingsScreen({
  name,
  currentGoal,
}: {
  name: string;
  currentGoal: number;
}) {
  const { showToast } = useToast();
  const [goal, setGoal] = useState(currentGoal);
  const [savingGoal, setSavingGoal] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Read the real stored preference after mount (avoids hydration mismatch
  // since localStorage isn't available during server rendering).
  useEffect(() => {
    setSoundEnabledState(isSoundEnabled());
  }, []);

  function handleSoundToggle(value: boolean) {
    setSoundEnabledState(value);
    persistSoundEnabled(value);
    if (value) playCorrect(); // quick audible confirmation it's now on
  }

  async function handleGoalChange(newGoal: number) {
    setGoal(newGoal);
    setSavingGoal(true);
    try {
      await api.updateDailyGoal(newGoal);
      showToast(`Daily goal set to ${newGoal} XP`, "🎯");
    } finally {
      setSavingGoal(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-gray-900 transition-colors pb-20 lg:pl-64">
      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
        <h1 className="text-2xl font-extrabold text-gray-700 dark:text-white mb-6">
          Settings
        </h1>

        {/* Account */}
        <SettingsSection title="Account">
          <div className="flex items-center gap-3 px-1 py-2 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-[#58CC02] flex items-center justify-center text-2xl flex-shrink-0">
              🦉
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="font-extrabold text-gray-700 dark:text-white">{name}</p>
              <p className="text-xs font-bold text-gray-400">Learning Spanish 🇪🇸</p>
            </div>
            <button
              type="button"
              onClick={() => showToast("More languages — Coming Soon", "🌍")}
              className="text-xs font-extrabold uppercase tracking-wide text-[#1899D6] dark:text-blue-300
                border-2 border-[#DDF4FF] dark:border-blue-900/50 rounded-2xl px-3 py-2"
            >
              Change
            </button>
          </div>
          <button
            type="button"
            onClick={() => showToast("Google / Apple sign-in — Coming Soon", "🔐")}
            className="w-full flex items-center justify-between px-1 py-2 mt-1 text-left"
          >
            <p className="font-bold text-gray-700 dark:text-white text-sm">Sign in with Google</p>
            <ComingSoonBadge />
          </button>
        </SettingsSection>

        {/* Daily Goal - genuinely functional, persisted to backend */}
        <SettingsSection title="Daily Goal">
          <p className="text-xs font-bold text-gray-400 px-1 mb-3">
            How much XP do you want to earn each day?
          </p>
          <div className="flex gap-2 px-1">
            {GOAL_OPTIONS.map((option) => (
              <button
                key={option}
                disabled={savingGoal}
                onClick={() => handleGoalChange(option)}
                className={`flex-1 py-3 rounded-2xl font-extrabold text-sm border-2 transition-all
                  ${
                    goal === option
                      ? "border-[#58CC02] bg-[#D7FFB8] dark:bg-green-900/30 text-[#58A700]"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300"
                  }`}
              >
                {option} XP
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* Preferences - sound is a real localStorage-backed preference now */}
        <SettingsSection title="Preferences">
          <ToggleRow
            label="Sound effects"
            sublabel="Play sounds for correct/incorrect answers"
            checked={soundEnabled}
            onChange={handleSoundToggle}
          />
          <ToggleRow
            label="Notifications"
            sublabel="Daily reminders (local preference only)"
            checked={notificationsEnabled}
            onChange={setNotificationsEnabled}
          />
        </SettingsSection>

        {/* Explicitly out of scope per assignment doc - placeholders */}
        <MockedFeaturesSection subtitle="These are placeholders for this assignment — not wired up yet." />
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 transition-colors">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 py-2">
      <div>
        <p className="font-bold text-gray-700 dark:text-white text-sm">{label}</p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        aria-label={`Toggle ${label}`}
        className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors flex-shrink-0
          ${checked ? "bg-[#58CC02]" : "bg-gray-200 dark:bg-gray-700"}`}
      >
        <span
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

