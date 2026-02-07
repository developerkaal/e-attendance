import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ClipboardCheck,
  Users,
  BarChart3,
  ArrowRight,
  Shield,
  Zap,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Easy Attendance",
    description:
      "Mark attendance with just a few clicks. Select class, date, and mark students as present or absent.",
  },
  {
    icon: Users,
    title: "Student Management",
    description:
      "Manage student records efficiently. Add, edit, or remove students with bulk upload support.",
  },
  {
    icon: BarChart3,
    title: "Detailed Reports",
    description:
      "Generate comprehensive reports by student, class, or date. Export to CSV for further analysis.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your data is protected with secure authentication and role-based access control.",
  },
  {
    icon: Zap,
    title: "Fast & Responsive",
    description:
      "Works seamlessly on desktop, tablet, and mobile devices with instant updates.",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    description:
      "Track attendance in real-time with instant statistics and visual indicators.",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        
        <div className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">SmartAttend</span>
            </div>
            <Button onClick={() => navigate("/login")}>
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </nav>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center py-16 lg:py-24 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Smart Attendance Management
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Effortless Attendance{" "}
              <span className="text-primary">Tracking</span> for{" "}
              <span className="text-primary">Educators</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Streamline your classroom management with our intuitive attendance
              system. Track, analyze, and report — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="h-12 px-8 text-base"
              >
                Start for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="h-12 px-8 text-base"
              >
                View Demo
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="max-w-5xl mx-auto animate-slide-up">
            <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="p-6 lg:p-8 bg-gradient-to-br from-background to-muted/20">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Students", value: "248", color: "primary" },
                    { label: "Classes", value: "12", color: "success" },
                    { label: "Today's Attendance", value: "94%", color: "success" },
                    { label: "Overall Rate", value: "87%", color: "warning" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-card rounded-xl p-4 border border-border"
                    >
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-14 rounded-lg flex items-center justify-center font-medium text-sm ${
                        i % 3 === 0
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-success/10 text-success border border-success/20"
                      }`}
                    >
                      {i % 3 === 0 ? "Absent" : "Present"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make attendance management simple
              and efficient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center gradient-hero rounded-3xl p-12 lg:p-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-xl mx-auto">
              Join educators who are already saving time with SmartAttend.
              Sign up now and start managing attendance effortlessly.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/login")}
              className="h-12 px-8 text-base"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">SmartAttend</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SmartAttend. Built for educators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
