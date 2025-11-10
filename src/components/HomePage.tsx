import { Button } from './ui/button';
import { Card } from './ui/card';
import { Mail, Moon, Users, Clock, Sparkles, PenTool } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  onNavigateToSignup: () => void;
}

export function HomePage({ onGetStarted, onNavigateToSignup }: HomePageProps) {
  const features = [
    {
      icon: Moon,
      title: 'Monthly Moondrops',
      description: 'Letters are delivered on the 1st of each month, creating anticipation and thoughtful correspondence.',
    },
    {
      icon: PenTool,
      title: 'Vintage Editor',
      description: 'Write on a beautiful paper-like canvas with formatting tools and custom backgrounds.',
    },
    {
      icon: Users,
      title: 'Letter Circles',
      description: 'Create groups and send one letter to multiple friends at once.',
    },
    {
      icon: Clock,
      title: 'Draft System',
      description: 'Save your thoughts and continue writing when inspiration strikes.',
    },
    {
      icon: Sparkles,
      title: 'Luna\'s Prompts',
      description: 'Get creative (and sometimes unhinged) writing prompts from our friendly AI companion.',
    },
    {
      icon: Mail,
      title: 'Track & Edit',
      description: 'View sent letters and edit drafts before they\'re delivered.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(42,42,42,0.1),transparent)]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="inline-block animate-float">
              <Moon className="w-16 h-16 text-foreground mx-auto mb-6" />
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground max-w-4xl mx-auto">
              Letters written under moonlight
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A cozy, vintage-inspired platform for thoughtful letter writing. 
              Slow down, connect deeply, and rediscover the art of correspondence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={onNavigateToSignup}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 shadow-vintage-lg"
              >
                Start Writing
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground mb-4">
              Everything you need for thoughtful writing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, elegant tools designed for meaningful correspondence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 paper-texture shadow-vintage hover:shadow-vintage-lg transition-all duration-300 border border-border"
              >
                <div className="relative z-10">
                  <div className="inline-flex p-3 rounded-lg bg-accent/20 mb-4">
                    <feature.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="font-display text-xl mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-foreground mb-4">
              How it works
            </h2>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center font-mono">
                1
              </div>
              <div>
                <h3 className="font-display text-xl mb-2">Write whenever inspiration strikes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Compose letters throughout the month using our vintage-style editor. 
                  Save drafts, customize backgrounds, and take your time.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center font-mono">
                2
              </div>
              <div>
                <h3 className="font-display text-xl mb-2">Send to friends or circles</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Address your letter to individual friends or entire groups. 
                  One thoughtful letter can reach everyone you care about.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center font-mono">
                3
              </div>
              <div>
                <h3 className="font-display text-xl mb-2">Letters drop on the 1st</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All letters are delivered on the first of each month, creating a delightful ritual 
                  of anticipation and connection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Moon className="w-12 h-12 text-foreground mx-auto mb-6 opacity-60" />
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-foreground mb-6">
            Ready to start your letter-writing journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join a community of thoughtful writers who believe in the power of slow, meaningful communication.
          </p>
          <Button
            size="lg"
            onClick={onNavigateToSignup}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 shadow-vintage-lg"
          >
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
}
