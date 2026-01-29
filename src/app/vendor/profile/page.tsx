import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { updateVendorProfile } from "./actions";
import { redirect } from "next/navigation";

export default async function VendorProfilePage() {
  const session = await requireUser();
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  if (role !== "vendor") redirect("/");

  // Defensive check for Prisma Client sync issues
  if (!prisma.vendorProfile) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-red-200">
        <h2 className="text-xl font-bold">System Error</h2>
        <p>The database client is out of sync. Please restart the application server to apply the latest schema changes.</p>
      </div>
    );
  }

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId }
  });

  async function updateVendorProfileAction(formData: FormData) {
    "use server";
    await updateVendorProfile(formData);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Vendor Profile</h2>
        <p className="text-neutral-400">Manage your public appearance and introduction.</p>
      </div>

      <form action={updateVendorProfileAction} className="space-y-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        
        {/* Banner */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-neutral-300">Banner Image (1200x300)</label>
          {profile?.bannerUrl && (
            <div className="relative h-48 w-full overflow-hidden rounded-lg border border-neutral-700">
              <img src={profile.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
            </div>
          )}
          <input 
            type="file" 
            name="banner" 
            accept="image/png, image/jpeg, image/webp"
            className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-700"
          />
          <p className="text-xs text-neutral-500">Max 5MB. JPG, PNG, WEBP.</p>
        </div>

        {/* Logo */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-neutral-300">Logo (200x200)</label>
          {profile?.logoUrl && (
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
              <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            </div>
          )}
          <input 
            type="file" 
            name="logo" 
            accept="image/png, image/jpeg, image/webp"
            className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-700"
          />
          <p className="text-xs text-neutral-500">Max 2MB. Transparent PNG preferred.</p>
        </div>

        {/* Intro */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-300">Introduction</label>
          <div className="relative rounded-md border border-neutral-700 shadow-sm">
             <textarea
              name="intro"
              rows={10}
              defaultValue={profile?.intro || ""}
              className="block w-full rounded-md border-0 bg-neutral-950 py-3 text-neutral-100 ring-1 ring-inset ring-neutral-800 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Tell travelers about your services..."
            />
          </div>
          <p className="text-xs text-neutral-500">You can use Markdown for formatting.</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
