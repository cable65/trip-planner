import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { createUser, updateUser, deleteUser } from "./actions";

export default async function UsersAdminPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">User Management</h1>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold text-white">Add User</h2>
        <form action={createUser} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input name="email" placeholder="Email" className="rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800" required />
          <input name="name" placeholder="Name" className="rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800" required />
          <select name="role" className="rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800">
            <option value="traveler">Traveler</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
          </select>
          <input name="password" type="password" placeholder="Temporary Password" className="rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800" required />
          <div className="md:col-span-2">
            <button className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Create</button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-950 text-neutral-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-neutral-300">{u.email}</td>
                <td className="px-4 py-3 text-neutral-300">{u.name ?? ""}</td>
                <td className="px-4 py-3 text-neutral-300">{u.role}</td>
                <td className="px-4 py-3">
                  <form action={updateUser} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input name="email" defaultValue={u.email} className="rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                    <input name="name" defaultValue={u.name ?? ""} className="rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                    <select name="role" defaultValue={u.role} className="rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800">
                      <option value="traveler">Traveler</option>
                      <option value="vendor">Vendor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="rounded bg-neutral-800 px-2 py-1 text-xs text-white hover:bg-neutral-700">Save</button>
                  </form>
                  <form action={deleteUser} className="mt-2">
                    <input type="hidden" name="id" value={u.id} />
                    <button className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

