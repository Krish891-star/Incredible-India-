import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, MapPin, Star } from 'lucide-react';
import heroImage from '@/assets/hero-taj-mahal.jpg';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Taj Mahal at sunset - Incredible India"
          className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse pulse-slow" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-6 animate-fade-up">
            <Star className="h-4 w-4 text-gold" fill="currentColor" />
            <span className="text-sm text-primary-foreground font-medium">
              Explore 700+ Incredible Destinations
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Discover the{' '}
            <span className="text-gradient">Magic</span>
            <br />
            of India
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/90 mb-8 leading-relaxed max-w-2xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
            From the majestic Himalayas to pristine beaches, ancient temples to vibrant cities — 
            embark on a journey that will transform your soul.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-12 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate('/map')}
              className="group transition-all duration-300 hover:shadow-lg"
            >
              <MapPin className="h-5 w-5" />
              Explore Interactive Map
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="heroOutline"
              size="lg"
              onClick={() => navigate('/states')}
              className="transition-all duration-300 hover:shadow-lg"
            >
              <Play className="h-5 w-5" />
              Virtual Tour
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 md:gap-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">28+</p>
              <p className="text-xs sm:text-sm text-primary-foreground/70">States</p>
            </div>
            <div className="w-px bg-primary-foreground/20 hidden sm:block" />
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">700+</p>
              <p className="text-xs sm:text-sm text-primary-foreground/70">Destinations</p>
            </div>
            <div className="w-px bg-primary-foreground/20 hidden sm:block" />
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">40+</p>
              <p className="text-xs sm:text-sm text-primary-foreground/70">UNESCO Sites</p>
            </div>
            <div className="w-px bg-primary-foreground/20 hidden sm:block" />
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">360°</p>
              <p className="text-xs sm:text-sm text-primary-foreground/70">Virtual Tours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary-foreground/70 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
