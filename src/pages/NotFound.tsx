import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto text-center">
          {/* Animated Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <MapPin className="h-16 w-16 text-primary" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-muted rounded-full blur-md" />
          </div>

          {/* Error Message */}
          <h1 className="font-display text-8xl font-bold text-primary mb-4">404</h1>
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Lost in the Journey?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            The destination you're looking for seems to have moved or doesn't exist.
            Let's get you back on track to explore Incredible India!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="saffron" size="lg" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Or explore these popular destinations:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/states" className="text-sm text-primary hover:underline">All States</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/map" className="text-sm text-primary hover:underline">Interactive Map</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/states/rajasthan" className="text-sm text-primary hover:underline">Rajasthan</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/states/kerala" className="text-sm text-primary hover:underline">Kerala</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}