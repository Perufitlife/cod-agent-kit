import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { Package } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center gap-12">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-1 flex-col justify-center space-y-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Order CRM</h1>
                <p className="text-muted-foreground">AI-Powered Customer Management</p>
              </div>
            </div>
            
            <div className="space-y-4 text-left">
              <h2 className="text-2xl font-semibold text-foreground">
                Automate your customer interactions
              </h2>
              <p className="text-muted-foreground text-lg">
                Streamline order management, automate workflows, and provide intelligent customer support with our AI-powered CRM platform.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-foreground">Smart Order Processing</h3>
                  <p className="text-sm text-muted-foreground">Automatically process and track orders from multiple channels</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-foreground">AI-Powered Conversations</h3>
                  <p className="text-sm text-muted-foreground">Intelligent chatbot handles customer inquiries 24/7</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-foreground">Advanced Analytics</h3>
                  <p className="text-sm text-muted-foreground">Get insights into customer behavior and business performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 flex justify-center">
          {isLogin ? (
            <LoginForm onToggleMode={toggleMode} />
          ) : (
            <SignUpForm onToggleMode={toggleMode} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;