import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";

export default async function VendorReviewsPage() {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  if (role !== "vendor") return <div>Unauthorized</div>;

  const reviews = await prisma.review.findMany({
    where: { targetType: "Vendor", targetId: userId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Reviews</h1>
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">No reviews yet.</div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white">Rating: {r.rating}/5</div>
                <div className="text-xs text-neutral-500">{r.createdAt.toISOString().slice(0,10)}</div>
              </div>
              <p className="mt-2 text-sm text-neutral-300">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

