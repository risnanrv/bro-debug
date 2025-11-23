import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import brototypeLogo from '@/assets/brototype-logo.png';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-4xl">
        <img 
          src={brototypeLogo} 
          alt="Brototype" 
          className="mx-auto mb-8 h-20 md:h-24 w-auto"
        />
        
        <h1 className="mb-6 text-5xl md:text-7xl font-bold tracking-tight">
          BroDebug <span className="text-primary">Support</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-4">
          Brother You Never Had
        </p>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Official complaint management and resolution portal for <span className="text-accent font-semibold">Brototype students</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 hover-lift"
          >
            Student Login
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 hover-lift border-2"
          >
            Admin Login
          </Button>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-foreground font-semibold">Brototype</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
