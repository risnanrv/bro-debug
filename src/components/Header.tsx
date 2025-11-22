import { useNavigate } from 'react-router-dom';
import brototypeLogo from '@/assets/brototype-logo.png';

interface HeaderProps {
  role?: 'student' | 'admin';
}

const Header = ({ role }: HeaderProps) => {
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <button 
          onClick={handleLogoClick}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <img 
            src={brototypeLogo} 
            alt="Brototype" 
            className="h-8 w-auto"
          />
        </button>
      </div>
    </header>
  );
};

export default Header;
