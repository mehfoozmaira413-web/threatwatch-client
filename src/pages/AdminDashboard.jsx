
import { useState, useEffect } from "react";
import axios from "axios";

console.log("🔥 NEW ADMIN DASHBOARD FILE IS RUNNING");

const API_URL = "http://localhost:5001";

export default function AdminDashboard() {
  const [scans, setScans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deletingScanId, setDeletingScanId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // =====================================================
  // CURRENT LOGGED-IN USER
  // =====================================================

  let currentUser = null;

  try {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      currentUser = JSON.parse(savedUser);
    }
  } catch (error) {
    console.error("CURRENT USER ERROR:", error);
  }

  const currentUserId =
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.userId ||
    null;

  // =====================================================
  // FETCH ADMIN DATA
  // =====================================================

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!token) {
        alert("Please login first.");
        return;
      }

      const [scansRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/scans`, {
          headers,
        }),

        axios.get(`${API_URL}/api/admin/users`, {
          headers,
        }),
      ]);

      setScans(scansRes.data.scans || []);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error(
        "FETCH ADMIN DATA ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to load admin data."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE SCAN
  // =====================================================

  const handleDeleteScan = async (scanId) => {
    if (!scanId) {
      return;
    }

    const confirmed = window.confirm(
      "⚠️ Are you sure you want to delete this scan?\n\nThis scan will be permanently removed."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingScanId(scanId);

      console.log(
        "🗑 ADMIN DELETE SCAN:",
        scanId
      );

      await axios.delete(
        `${API_URL}/api/admin/scans/${scanId}`,
        {
          headers,
        }
      );

      // Remove immediately from frontend
      setScans((previousScans) =>
        previousScans.filter(
          (scan) => scan._id !== scanId
        )
      );

      alert(
        "✅ Scan deleted successfully."
      );
    } catch (error) {
      console.error(
        "DELETE SCAN ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete scan."
      );
    } finally {
      setDeletingScanId(null);
    }
  };

  // =====================================================
  // DELETE USER + ALL USER SCANS
  // =====================================================

  const handleDeleteUser = async (userId) => {
    if (!userId) {
      return;
    }

    // -------------------------------------------------
    // PREVENT CURRENT ADMIN FROM DELETING THEMSELVES
    // -------------------------------------------------

    if (
      currentUserId &&
      String(currentUserId) === String(userId)
    ) {
      alert(
        "❌ You cannot delete your own admin account."
      );

      return;
    }

    const userToDelete = users.find(
      (user) =>
        String(user._id) === String(userId)
    );

    const userName =
      userToDelete?.name ||
      userToDelete?.email ||
      "this user";

    const confirmed = window.confirm(
      `⚠️ Delete ${userName}?\n\nThis will permanently delete:\n• User account\n• All scans/history belonging to this user\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(userId);

      console.log(
        "🗑 ADMIN DELETE USER:",
        userId
      );

      await axios.delete(
        `${API_URL}/api/admin/users/${userId}`,
        {
          headers,
        }
      );

      // -------------------------------------------------
      // REMOVE USER FROM USERS TABLE
      // -------------------------------------------------

      setUsers((previousUsers) =>
        previousUsers.filter(
          (user) =>
            String(user._id) !==
            String(userId)
        )
      );

      // -------------------------------------------------
      // REMOVE ALL USER SCANS FROM SCANS TABLE
      // -------------------------------------------------

      setScans((previousScans) =>
        previousScans.filter((scan) => {
          const scanUserId =
            scan.user?._id ||
            scan.user;

          return (
            String(scanUserId) !==
            String(userId)
          );
        })
      );

      alert(
        "✅ User and all their scans deleted successfully."
      );
    } catch (error) {
      console.error(
        "DELETE USER ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete user."
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-white text-2xl">
        Loading Admin Data...
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="p-6 space-y-10 text-white bg-[#0a0e1a] min-h-screen">

      {/* =================================================
          USERS
      ================================================= */}

      <div>
        <h2 className="text-2xl font-bold mb-4">
          All Registered Users - Total:{" "}
          {users.length}
        </h2>

        <div className="overflow-x-auto bg-[#121829] rounded-2xl p-4 border border-gray-800">

          <table className="w-full">

            <thead>
              <tr className="text-left text-purple-300 text-lg">

                <th className="p-4">
                  #
                </th>

                <th className="p-4">
                  NAME
                </th>

                <th className="p-4">
                  EMAIL
                </th>

                <th className="p-4">
                  ROLE
                </th>

                <th className="p-4">
                  REGISTERED
                </th>

                <th className="p-4">
                  ACTION
                </th>

              </tr>
            </thead>

            <tbody>

              {users.length === 0 ? (

                <tr>
                  <td
                    colSpan="6"
                    className="p-4 text-center text-gray-400"
                  >
                    No Users Found
                  </td>
                </tr>

              ) : (

                users.map((user, index) => {

                  const isCurrentAdmin =
                    currentUserId &&
                    String(currentUserId) ===
                      String(user._id);

                  const isDeleting =
                    deletingUserId === user._id;

                  return (
                    <tr
                      key={user._id}
                      className="border-t border-gray-800 text-lg hover:bg-[#1a2333]"
                    >

                      <td className="p-4">
                        {index + 1}
                      </td>

                      <td className="p-4">
                        {user.name || "N/A"}
                      </td>

                      <td className="p-4">
                        {user.email || "N/A"}
                      </td>

                      <td className="p-4 text-yellow-400 font-bold">
                        {user.role || "User"}
                      </td>

                      <td className="p-4">
                        {user.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="p-4">

                        {isCurrentAdmin ? (

                          <span
                            style={{
                              display:
                                "inline-block",
                              background:
                                "rgba(100,116,139,0.25)",
                              color:
                                "#94a3b8",
                              padding:
                                "8px 14px",
                              borderRadius:
                                "8px",
                              fontWeight:
                                "bold",
                              fontSize:
                                "13px",
                            }}
                          >
                            CURRENT ADMIN
                          </span>

                        ) : (

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteUser(
                                user._id
                              )
                            }
                            disabled={
                              isDeleting
                            }
                            style={{
                              background:
                                isDeleting
                                  ? "#7f1d1d"
                                  : "#dc2626",
                              color:
                                "white",
                              padding:
                                "9px 16px",
                              borderRadius:
                                "8px",
                              fontWeight:
                                "bold",
                              border:
                                "1px solid #ef4444",
                              cursor:
                                isDeleting
                                  ? "not-allowed"
                                  : "pointer",
                              minWidth:
                                "110px",
                              opacity:
                                isDeleting
                                  ? 0.7
                                  : 1,
                            }}
                          >
                            {isDeleting
                              ? "Deleting..."
                              : "🗑 DELETE"}
                          </button>

                        )}

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>
      </div>


      {/* =================================================
          ALL SCANS
      ================================================= */}

      <div>

        <h2 className="text-2xl font-bold mb-4">
          Complete Platform-Wide Security Scan
          Records - Total: {scans.length}
        </h2>

        <div className="overflow-x-auto bg-[#121829] rounded-2xl p-4 border border-gray-800">

          <table className="w-full">

            <thead>

              <tr className="text-left text-purple-300 text-lg">

                <th className="p-4">
                  #
                </th>

                <th className="p-4">
                  TYPE
                </th>

                <th className="p-4">
                  USER
                </th>

                <th className="p-4">
                  TARGET
                </th>

                <th className="p-4">
                  RISK
                </th>

                <th className="p-4">
                  VERDICT
                </th>

                <th className="p-4">
                  DATE
                </th>

                <th className="p-4">
                  ACTION
                </th>

              </tr>

            </thead>

            <tbody>

              {scans.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="p-4 text-center text-gray-400"
                  >
                    No Scans Found
                  </td>

                </tr>

              ) : (

                scans.map((scan, index) => {

                  const isDeleting =
                    deletingScanId ===
                    scan._id;

                  return (
                    <tr
                      key={scan._id}
                      className="border-t border-gray-800 text-lg hover:bg-[#1a2333]"
                    >

                      <td className="p-4">
                        {index + 1}
                      </td>

                      <td className="p-4 text-blue-400 font-bold">
                        {scan.scanType ||
                          "N/A"}
                      </td>

                      <td className="p-4">
                        {scan.user?.email ||
                          "N/A"}
                      </td>

                      <td className="p-4 text-yellow-400 max-w-[300px]">
                        <div className="truncate">
                          {scan.url ||
                            "N/A"}
                        </div>
                      </td>

                      <td className="p-4 text-red-400 font-bold">
                        {scan.riskScore ??
                          0}
                        %
                      </td>

                      <td className="p-4 font-bold">
                        {scan.verdict ||
                          "UNCERTAIN"}
                      </td>

                      <td className="p-4">
                        {scan.createdAt
                          ? new Date(
                              scan.createdAt
                            ).toLocaleString()
                          : "N/A"}
                      </td>

                      <td className="p-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteScan(
                              scan._id
                            )
                          }
                          disabled={
                            isDeleting
                          }
                          style={{
                            background:
                              isDeleting
                                ? "#7f1d1d"
                                : "#dc2626",
                            color:
                              "white",
                            padding:
                              "9px 16px",
                            borderRadius:
                              "8px",
                            fontWeight:
                              "bold",
                            border:
                              "1px solid #ef4444",
                            cursor:
                              isDeleting
                                ? "not-allowed"
                                : "pointer",
                            minWidth:
                              "110px",
                            opacity:
                              isDeleting
                                ? 0.7
                                : 1,
                          }}
                        >
                          {isDeleting
                            ? "Deleting..."
                            : "🗑 DELETE"}
                        </button>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}