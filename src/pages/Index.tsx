import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-2xl px-4">
        <h1 className="mb-4 text-6xl font-bold tracking-tight">BroDebug Support</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Private complaint management platform for Brototype students
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
            Admin Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
