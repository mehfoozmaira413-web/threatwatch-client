import { useState, useEffect } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react"; // icon add kiya

const API_URL = "http://localhost:5001"; // <-- 5001 KIYA

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_URL}/api/admin/users`, { headers });
      setUsers(res.data.users || []); // tumhara backend {success, users} return karta hai
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.patch(`${API_URL}/api/admin/users/${id}/role`, { role: newRole }, { headers });
      fetchUsers();
      alert("✅ Role updated successfully!");
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Role update failed"));
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("⚠️ Kya tum sure ho is user ko delete karna hai? Iske saare scans bhi delete ho jayenge!")){
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { headers });
      setUsers(users.filter(u => u._id !== id)); // UI se turant remove
      alert("🗑️ User deleted successfully!");
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Delete failed"));
    }
  };

  if(loading) return <p className="dark:text-black text-center p-10">Loading users...</p>
  if(error) return <p className="text-red-500 text-center p-10">{error}</p>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 dark:text-black">Manage Users</h1>
      <div className="bg-[#121829] dark:bg-white rounded-2xl border-gray-800 dark:border-gray-200 p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[1.35rem] text-purple-300 dark:text-purple-600">
              <th className="p-4">NAME</th>
              <th className="p-4">EMAIL</th>
              <th className="p-4">ROLE</th>
              <th className="p-4">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4" className="p-4 text-center dark:text-black">No users found</td></tr>
            ) : (
              users.map(user => (
                <tr key={user._id} className="border-t border-gray-800 dark:border-gray-200 text-[1.3rem]">
                  <td className="p-4 dark:text-black">{user.name}</td>
                  <td className="p-4 dark:text-black">{user.email}</td>
                  <td className="p-4">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user._id, e.target.value)} 
                      className="bg-[#1e293b] dark:bg-gray-200 text-white dark:text-black p-2 rounded"
                      disabled={user._id === localStorage.getItem('userId')} // khud ka role change na ho
                    >
                      <option value="User">User</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleDelete(user._id)} 
                      className="bg-red-600 hover:bg-red-700 hover:scale-105 transition px-4 py-2 rounded text-white flex items-center gap-2"
                      disabled={user._id === localStorage.getItem('userId')} // khud ko delete na kar sake
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}