export type ProfileFields = {
  name?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  location?: string | null;
  website?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
};

export type ProfilePrivacyValue = "private" | "public" | "connections";

export type ProfilePrivacy = {
  name?: ProfilePrivacyValue;
  email?: ProfilePrivacyValue;
  phone?: ProfilePrivacyValue;
  jobTitle?: ProfilePrivacyValue;
  company?: ProfilePrivacyValue;
  location?: ProfilePrivacyValue;
  website?: ProfilePrivacyValue;
  bio?: ProfilePrivacyValue;
};

export function computeProfileCompletion(fields: ProfileFields): number {
  const values = [
    fields.name,
    fields.phone,
    fields.jobTitle,
    fields.company,
    fields.location,
    fields.website,
    fields.bio,
    fields.avatarUrl,
    fields.coverUrl
  ];

  const total = values.length;
  if (total === 0) return 0;

  const filled = values.filter((v) => v && String(v).trim().length > 0).length;
  return Math.round((filled / total) * 100);
}

export function normalizeProfilePrivacy(input: ProfilePrivacy | null | undefined): ProfilePrivacy {
  const base: ProfilePrivacy = {
    name: "connections",
    email: "connections",
    phone: "private",
    jobTitle: "connections",
    company: "connections",
    location: "connections",
    website: "public",
    bio: "public"
  };

  if (!input) return base;

  return {
    ...base,
    ...input
  };
}

