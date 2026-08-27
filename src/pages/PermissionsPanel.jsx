import { useState, useEffect } from 'react'; // useEffect add kiya
import { ShieldCheck, Save, Loader2 } from 'lucide-react';
import axios from 'axios'; // axios add kiya

export default function PermissionsPanel() {
  // 1. Default permissions
  const [roles, setRoles] = useState({
    user: { canScan: true, canViewHistory: true, canFlag: false, canDelete: false },
    moderator: { canScan: true, canViewHistory: true, canFlag: true, canDelete: true },
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // DB se data lane ke liye

  // 2. List of permissions
  const permissionsList = [
    { key: 'canScan', label: 'Scan Karna' },
    { key: 'canViewHistory', label: 'History Dekhna' },
    { key: 'canFlag', label: 'Scan Flag Karna' },
    { key: 'canDelete', label: 'Scan Delete Karna' },
  ];

  // 3. PAGE LOAD PE DB SE PERMISSIONS LANA
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/admin/permissions', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          const permsArray = res.data.permissions; // [{role: "User", permissions: {...}},...]

          // Array ko object me convert karna: {user: {}, moderator: {}}
          const formattedRoles = {
            user: permsArray.find(p => p.role === 'User')?.permissions || roles.user,
            moderator: permsArray.find(p => p.role === 'Moderator')?.permissions || roles.moderator,
          };
          setRoles(formattedRoles);
        }
      } catch (err) {
        console.error("Failed to fetch permissions", err);
        alert("Could not load permissions from server");
      } finally {
        setFetching(false);
      }
    };
    fetchPermissions();
  }, []); // sirf 1 baar chalega

  // 4. Jab checkbox click ho
  const handleToggle = (role, permission) => {
    setRoles(prev => ({
     ...prev,
      [role]: {...prev[role], [permission]:!prev[role][permission] }
    }));
  }

  // 5. SAVE KA FUNCTION - API KO DATA BHEJNA
  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/permissions', roles, { // roles = {user: {}, moderator: {}}
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert("Permissions Saved Successfully!");
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving permissions: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  }

  if (fetching) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-[#007c91]" /></div>
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl mx-auto mt-6">

      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-[#007c91]" size={28} />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Roles & Permissions</h2>
      </div>

      <table className="w-full text-sm">
        <thead className="border-b dark:border-gray-700">
          <tr>
            <th className="p-3 text-left">Feature</th>
            <th className="p-3 text-center">User</th>
            <th className="p-3 text-center">Moderator</th>
          </tr>
        </thead>
        <tbody>
          {permissionsList.map(({ key, label }) => (
            <tr key={key} className="border-b dark:border-gray-700">
              <td className="p-3 font-medium">{label}</td>
              <td className="text-center">
                <input type="checkbox" checked={roles.user[key]} onChange={() => handleToggle('user', key)} className="w-5 h-5 accent-[#007c91] cursor-pointer"/>
              </td>
              <td className="text-center">
                <input type="checkbox" checked={roles.moderator[key]} onChange={() => handleToggle('moderator', key)} className="w-5 h-5 accent-[#007c91] cursor-pointer"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-[#007c91] text-white rounded-lg hover:bg-[#006579] disabled:bg-gray-400"
        >
          {loading? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loading? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}