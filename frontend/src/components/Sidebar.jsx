import { Link, useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiBarChart2,
  FiClock,
  FiBookOpen,
  FiFileText,
  FiUser,
  FiLogOut,
  FiX,
} from "react-icons/fi";

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const menuItems = [
    { name: "Dashboard", icon: <FiHome />, path: "/dashboard" },
    { name: "Analytics", icon: <FiBarChart2 />, path: "/analytics" },
    { name: "History", icon: <FiClock />, path: "/history" },
    { name: "Practice Questions", icon: <FiBookOpen />, path: "/practice" },
    { name: "Resources", icon: <FiFileText />, path: "/resources" },
    { name: "Profile", icon: <FiUser />, path: "/profile" },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-sm z-50 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h1 className="text-xl font-bold text-indigo-600">
            InterviewForge
          </h1>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden"
          >
            <FiX size={22} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition
                ${
                  location.pathname === item.path
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50">
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}