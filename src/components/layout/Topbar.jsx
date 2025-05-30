import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, LogIn, LogOut } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import "./Topbar.css";

const Topbar = ({ isLoggedIn = false, onLoginStatusChange }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      if (onLoginStatusChange) {
        onLoginStatusChange(true);
      }
    }
  }, [onLoginStatusChange]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Threads", path: "/threads" },
    { name: "Contact Us", path: "/contact" },
    { name: "Help and Support", path: "/help" }
  ];

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    
    if (onLoginStatusChange) {
      onLoginStatusChange(false);
    }
    
    toast({
      title: "Success",
      description: "You have been logged out",
    });
    
    navigate("/");
  };

  return (
    <div className="topbar">
      <div className="search-container">
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Explore..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="navigation">
        <div className="nav-container">
          <nav className="nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`nav-link ${
                  location.pathname === link.path ? "active" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {user ? (
          <div className="auth-buttons">
            <button 
              className="auth-button"
              onClick={handleLogoutClick}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button 
              className="auth-button"
              onClick={handleLoginClick}
            >
              <LogIn size={20} />
              <span>Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar; 