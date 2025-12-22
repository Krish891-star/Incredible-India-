import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Compass, Shield, Sparkles, Globe2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Map,
    title: 'Interactive Maps',
    description: 'Explore every corner of India with our detailed interactive maps featuring all 28 states and 8 union territories.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Camera,
    title: '360° Virtual Tours',
    description: 'Experience iconic landmarks from home with immersive 360-degree virtual tours of famous monuments and sites.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: Sparkles,
    title: 'AI Trip Planner',
    description: 'Let our AI create personalized itineraries based on your interests, budget, and travel dates.',
    color: 'bg-gold/10 text-gold-muted',
  },
  {
    icon: Shield,
    title: 'Safety Information',
    description: 'Stay informed with real-time safety updates, health advisories, and emergency contacts for every region.',
    color: 'bg-terracotta/10 text-terracotta',
  },
  {
    icon: Globe2,
    title: 'Multi-language Support',
    description: 'Browse in your preferred language with support for Hindi, English, and major regional languages.',
    color: 'bg-indian-green/10 text-indian-green',
  },
  {
    icon: Compass,
    title: 'Local Experiences',
    description: 'Discover hidden gems, local cuisines, and authentic cultural experiences curated by local experts.',
    color: 'bg-navy/10 text-navy',
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4 bg-accent/10 text-accent">
            Platform Features
          </Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need for <span className="text-gradient">Perfect Travel</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform combines cutting-edge technology with deep local knowledge to make your India journey unforgettable.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={cn(
                'group relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm',
                'hover:shadow-card hover:border-primary/20 transition-all duration-300',
                'animate-fade-up'
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8">
                {/* Icon */}
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110',
                  feature.color
                )}>
                  <feature.icon className="h-7 w-7" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
