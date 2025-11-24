import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, MessageSquare, Clock, CheckCircle, Lock, Users, ArrowRight, FileCheck } from 'lucide-react';
import brototypeLogo from '@/assets/brototype-logo.png';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-5xl mx-auto">
            <img 
              src={brototypeLogo} 
              alt="Brototype" 
              className="mx-auto mb-8 h-[200px] w-[150px] animate-fade-in"
            />
            
            <h1 className="mb-6 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-fade-in">
              BroDebug <span className="text-primary">Support</span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-accent font-semibold mb-4 animate-fade-in">
              Brother You Never Had
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in">
              Your voice matters. Official complaint management and resolution portal built exclusively for <span className="text-accent font-semibold">Brototype students</span>. We're here to listen, act, and make things right.
            </p>
            
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-12 py-7 hover-lift animate-fade-in group"
            >
              Login to Portal
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* What is BroDebug Section */}
      <section className="py-20 md:py-32 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What is <span className="text-primary">BroDebug?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A dedicated platform where your concerns become our priority
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="gradient-card border-border/50 hover-lift">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Your Voice Heard</h3>
                <p className="text-muted-foreground">
                  Submit complaints anonymously or with your identity. Every issue is documented, tracked, and addressed by our dedicated team.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border/50 hover-lift">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Fast Resolution</h3>
                <p className="text-muted-foreground">
                  Real-time tracking from submission to resolution. Get updates at every step and see exactly how we're working to solve your concerns.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border/50 hover-lift">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Complete Privacy</h3>
                <p className="text-muted-foreground">
                  Your data is encrypted and protected. Choose anonymity if needed. We respect your privacy while ensuring accountability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why This Platform Exists */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why <span className="text-primary">BroDebug</span> Exists
              </h2>
            </div>
            
            <Card className="gradient-card border-primary/20">
              <CardContent className="p-8 md:p-12">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                  At Brototype, we believe in creating an environment where every student feels safe, supported, and empowered to speak up. But we also know that sometimes, raising concerns in person can be intimidating.
                </p>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                  That's why we built <span className="text-accent font-semibold">BroDebug</span> — a transparent, secure platform where your voice isn't just heard, it's acted upon. Whether it's about hostel conditions, curriculum concerns, mentor behavior, or anything that affects your journey with us.
                </p>
                <p className="text-lg md:text-xl text-foreground font-semibold leading-relaxed">
                  Your feedback shapes our culture. Your complaints drive our improvements. Because at Brototype, you're not just a student — you're family.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple, transparent, and effective complaint resolution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="gradient-card border-border/50 hover-lift">
              <CardContent className="pt-8">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Submit Your Complaint</h3>
                <p className="text-muted-foreground">
                  Log in and describe your issue with optional attachments. Choose to remain anonymous if needed.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border/50 hover-lift">
              <CardContent className="pt-8">
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xl mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Tracking</h3>
                <p className="text-muted-foreground">
                  Your complaint gets a unique ID. Track its status in real-time from pending to resolved.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border/50 hover-lift">
              <CardContent className="pt-8">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Admin Reviews</h3>
                <p className="text-muted-foreground">
                  Our team reviews, prioritizes, and assigns your complaint to the right department for action.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border/50 hover-lift">
              <CardContent className="pt-8">
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xl mb-6">
                  4
                </div>
                <h3 className="text-xl font-bold mb-3">Get Resolution</h3>
                <p className="text-muted-foreground">
                  Receive updates and final resolution. Share feedback on how we handled your concern.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Security & <span className="text-primary">Privacy</span> First
              </h2>
              <p className="text-xl text-muted-foreground">
                Your trust is our responsibility
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">End-to-End Encryption</h3>
                <p className="text-muted-foreground">All data is encrypted and stored securely</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Anonymous Option</h3>
                <p className="text-muted-foreground">Submit complaints without revealing identity</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Full Transparency</h3>
                <p className="text-muted-foreground">Track every step of the resolution process</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Make Your <span className="text-primary">Voice Heard?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of Brototype students using BroDebug to create positive change
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-12 py-7 hover-lift group"
            >
              Access Portal Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={brototypeLogo} 
                alt="Brototype" 
                className="h-[60px] w-[45px]"
              />
              <div className="text-left">
                <p className="font-bold text-lg">BroDebug Support</p>
                <p className="text-sm text-muted-foreground">By Brototype</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground mb-1">
                Official Complaint Management Portal
              </p>
              <p className="text-xs text-muted-foreground">
                © 2024 Brototype. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
