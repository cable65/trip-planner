"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { requestProfileChangeCode, updateUserProfile } from "./actions";
import { computeProfileCompletion, normalizeProfilePrivacy } from "@/lib/profile";

type Json = Record<string, any> | null;

type ProfileFormProps = {
  user: {
    name: string | null;
    email: string;
    phone: string | null;
    jobTitle: string | null;
    company: string | null;
    location: string | null;
    website: string | null;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    preferences: Json;
    profilePrivacy: Json;
  };
};

const initialFormState = { ok: false, error: "" };

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction] = useFormState(updateUserProfile, initialFormState);
  const [pendingCode, startCodeTransition] = useTransition();
  const [challengeId, setChallengeId] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [company, setCompany] = useState(user.company ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [website, setWebsite] = useState(user.website ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [newsletter, setNewsletter] = useState<boolean>(
    Boolean((user.preferences as any)?.newsletter)
  );
  const [marketingEmails, setMarketingEmails] = useState<boolean>(
    Boolean((user.preferences as any)?.marketingEmails)
  );
  const [contactMethod, setContactMethod] = useState<string>(
    (user.preferences as any)?.contactMethod || "email"
  );

  const initialPrivacy = normalizeProfilePrivacy(user.profilePrivacy as any);

  const [privacyName, setPrivacyName] = useState<string>(initialPrivacy.name || "connections");
  const [privacyEmail, setPrivacyEmail] = useState<string>(initialPrivacy.email || "connections");
  const [privacyPhone, setPrivacyPhone] = useState<string>(initialPrivacy.phone || "private");
  const [privacyJobTitle, setPrivacyJobTitle] = useState<string>(
    initialPrivacy.jobTitle || "connections"
  );
  const [privacyCompany, setPrivacyCompany] = useState<string>(
    initialPrivacy.company || "connections"
  );
  const [privacyLocation, setPrivacyLocation] = useState<string>(
    initialPrivacy.location || "connections"
  );
  const [privacyWebsite, setPrivacyWebsite] = useState<string>(initialPrivacy.website || "public");
  const [privacyBio, setPrivacyBio] = useState<string>(initialPrivacy.bio || "public");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatarUrl
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(
    user.coverUrl
  );

  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    if (state.ok) {
      setTwoFactorCode("");
      setDevCode(null);
      setChallengeId("");
    }
  }, [state.ok]);

  const completionPercent = useMemo(
    () =>
      computeProfileCompletion({
        name,
        phone,
        jobTitle,
        company,
        location,
        website,
        bio,
        avatarUrl: avatarPreview,
        coverUrl: coverPreview
      }),
    [
      name,
      phone,
      jobTitle,
      company,
      location,
      website,
      bio,
      avatarPreview,
      coverPreview
    ]
  );

  const canSubmit = Boolean(challengeId) && twoFactorCode.length === 6;

  return (
    <div className="space-y-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="text-sm text-neutral-400">
            Manage how your information appears across the platform.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Profile completion</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <form
          className="space-y-6"
          action={(formData) => {
            formData.set("challengeId", challengeId);
            formData.set("twoFactorCode", twoFactorCode);
            formAction(formData);
          }}
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Name
                </label>
                <input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800 focus:ring-indigo-600"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Email
                </label>
                <input
                  value={user.email}
                  disabled
                  className="w-full cursor-not-allowed rounded bg-neutral-950 px-3 py-2 text-sm text-neutral-400 ring-1 ring-neutral-800"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Phone
                </label>
                <input
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800 focus:ring-indigo-600"
                  placeholder="+60 12 345 6789"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Location
                </label>
                <input
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800 focus:ring-indigo-600"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Job title
                </label>
                <input
                  name="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800 focus:ring-indigo-600"
                  placeholder="Travel consultant"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Company
                </label>
                <input
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800 focus:ring-indigo-600"
                  placeholder="Trip Planner Co."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">
                Website
              </label>
              <input
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800 focus:ring-indigo-600"
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">
                Bio
              </label>
              <textarea
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800 focus:ring-indigo-600"
                placeholder="Tell others a bit about yourself as a traveler or vendor."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-300">
                  Preferences
                </span>
                <div className="space-y-2 rounded border border-neutral-800 bg-neutral-950 p-3 text-xs">
                  <label className="flex items-center gap-2 text-neutral-300">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="h-3 w-3 rounded border-neutral-700 bg-neutral-900"
                    />
                    Receive product updates and inspiration
                  </label>
                  <label className="flex items-center gap-2 text-neutral-300">
                    <input
                      type="checkbox"
                      name="marketingEmails"
                      checked={marketingEmails}
                      onChange={(e) => setMarketingEmails(e.target.checked)}
                      className="h-3 w-3 rounded border-neutral-700 bg-neutral-900"
                    />
                    Receive occasional marketing emails
                  </label>
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] text-neutral-400">
                      Preferred contact method
                    </p>
                    <select
                      name="contactMethod"
                      value={contactMethod}
                      onChange={(e) => setContactMethod(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 text-xs ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="none">Do not contact</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-300">
                  Privacy
                </span>
                <div className="grid grid-cols-2 gap-2 rounded border border-neutral-800 bg-neutral-950 p-3 text-[11px]">
                  <label className="space-y-1">
                    <span className="block text-neutral-400">Name</span>
                    <select
                      name="privacy_name"
                      value={privacyName}
                      onChange={(e) => setPrivacyName(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="private">Private</option>
                      <option value="connections">Connections</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-neutral-400">Email</span>
                    <select
                      name="privacy_email"
                      value={privacyEmail}
                      onChange={(e) => setPrivacyEmail(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="private">Private</option>
                      <option value="connections">Connections</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-neutral-400">Phone</span>
                    <select
                      name="privacy_phone"
                      value={privacyPhone}
                      onChange={(e) => setPrivacyPhone(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="private">Private</option>
                      <option value="connections">Connections</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-neutral-400">Job title</span>
                    <select
                      name="privacy_jobTitle"
                      value={privacyJobTitle}
                      onChange={(e) => setPrivacyJobTitle(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="private">Private</option>
                      <option value="connections">Connections</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-neutral-400">Company</span>
                    <select
                      name="privacy_company"
                      value={privacyCompany}
                      onChange={(e) => setPrivacyCompany(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="private">Private</option>
                      <option value="connections">Connections</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-neutral-400">Location</span>
                    <select
                      name="privacy_location"
                      value={privacyLocation}
                      onChange={(e) => setPrivacyLocation(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="private">Private</option>
                      <option value="connections">Connections</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-neutral-400">Website</span>
                    <select
                      name="privacy_website"
                      value={privacyWebsite}
                      onChange={(e) => setPrivacyWebsite(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="private">Private</option>
                      <option value="connections">Connections</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-neutral-400">Bio</span>
                    <select
                      name="privacy_bio"
                      value={privacyBio}
                      onChange={(e) => setPrivacyBio(e.target.value)}
                      className="w-full rounded bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800 focus:ring-indigo-600"
                    >
                      <option value="private">Private</option>
                      <option value="connections">Connections</option>
                      <option value="public">Public</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-300">
                  Avatar
                </p>
                {avatarPreview && (
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-800">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  name="avatar"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-xs text-neutral-400 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-300">
                  Cover image
                </p>
                {coverPreview && (
                  <div className="h-24 w-full overflow-hidden rounded-lg bg-neutral-800">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  name="cover"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-xs text-neutral-400 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-700"
                />
              </div>
            </div>

            <div className="space-y-3 rounded border border-amber-800/60 bg-amber-900/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Security check
              </p>
              <p className="text-xs text-amber-100">
                Sensitive profile changes require a time-limited security code.
              </p>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                  type="button"
                  onClick={() => {
                    startCodeTransition(async () => {
                      const res = await requestProfileChangeCode();
                      setChallengeId(res.challengeId);
                      setDevCode(res.code);
                    });
                  }}
                  className="inline-flex items-center justify-center rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
                  disabled={pendingCode}
                >
                  {pendingCode ? "Requesting code…" : "Request security code"}
                </button>
                <div className="flex-1 space-y-1 text-xs text-neutral-300">
                  <p>
                    A one-time code will be required to save changes.
                  </p>
                  {devCode && process.env.NODE_ENV === "development" && (
                    <p className="font-mono text-amber-300">
                      For development, your code is {devCode}.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Security code
                </label>
                <input
                  name="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full rounded bg-neutral-950 px-3 py-2 text-sm tracking-[0.3em] ring-1 ring-neutral-800 focus:ring-amber-500"
                  placeholder="••••••"
                />
                <input type="hidden" name="challengeId" value={challengeId} />
              </div>
            </div>

            {state.error && (
              <div className="text-xs text-red-400">{state.error}</div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                Save profile
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-4 rounded border border-neutral-800 bg-neutral-950 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Live preview
          </p>
          <div className="space-y-4 rounded border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-800">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-500">
                    {name?.charAt(0) || user.email.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">
                    {name || user.email}
                  </p>
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-300">
                    {privacyName}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {jobTitle || "Add your role"}
                  {company ? ` at ${company}` : ""}
                </p>
                <p className="text-xs text-neutral-500">
                  {location || "Add your location"}
                </p>
              </div>
            </div>
            {coverPreview && (
              <div className="h-20 w-full overflow-hidden rounded-lg bg-neutral-800">
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {bio && (
              <p className="text-xs text-neutral-300">{bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

