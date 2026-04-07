import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { listProfiles, subscribeToTable, updateProfileRecord } from "../../services/platformService.js";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";

const ROLE_OPTIONS = ["user", "worker", "admin"];

export default function AdminPeoplePage() {
  const { pushToast } = useToast();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await listProfiles();
        setPeople(data);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(true);

    return subscribeToTable({
      channelName: "admin-people",
      table: "profiles",
      onChange: () => load(false),
    });
  }, []);

  async function handleRoleChange(personId, nextRole) {
    try {
      await updateProfileRecord(personId, { role: nextRole });
      setPeople((current) =>
        current.map((person) => (person.id === personId ? { ...person, role: nextRole } : person))
      );
      pushToast({
        title: "Role updated",
        message: `Account role changed to ${nextRole}.`,
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Role update failed",
        message: error.message || "Unable to update the selected account.",
        type: "error",
      });
    }
  }

  if (loading) {
    return <LoadingPanel rows={5} />;
  }

  return (
    <div className="space-y-4">
      {people.map((person) => (
        <div key={person.id} className="panel rounded-[30px] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-2xl bg-amber-300/10 p-3 text-amber-200">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{person.name}</p>
                  <p className="text-sm text-slate-400">{person.email}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">{person.phone || "No phone number added yet"}</p>
              <p className="mt-2 text-sm text-slate-500">{person.address || "No address on file"}</p>
            </div>

            <div className="grid min-w-[240px] gap-3">
              <select
                value={person.role || "user"}
                onChange={(event) => handleRoleChange(person.id, event.target.value)}
                className="input-shell w-full rounded-2xl px-4 py-3.5"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
