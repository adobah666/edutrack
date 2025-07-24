"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginPage = () => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const role = user?.publicMetadata.role;

    if (role) {
      router.push(`/${role}`);
      console.log("Redirecting to", role);
    }
  }, [user, router]);

  const features = [
    {
      icon: "👥",
      title: "Multi-Tenant Architecture",
      description: "Secure school isolation with role-based access control"
    },
    {
      icon: "📊",
      title: "Comprehensive Analytics",
      description: "Real-time insights into attendance, performance, and fees"
    },
    {
      icon: "💰",
      title: "Fee Management",
      description: "Automated fee tracking, payments, and reminder system"
    },
    {
      icon: "📅",
      title: "Smart Scheduling",
      description: "Conflict-free timetables with automated notifications"
    },
    {
      icon: "📱",
      title: "Modern Interface",
      description: "Responsive design that works on all devices"
    },
    {
      icon: "🔒",
      title: "Enterprise Security",
      description: "Advanced authentication and data protection"
    }
  ];

  const stats = [
    { number: "100%", label: "Type-Safe" },
    { number: "Multi", label: "Tenant" },
    { number: "24/7", label: "Available" },
    { number: "∞", label: "Scalable" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="EduTrack Logo" width={40} height={40} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">EduTrack</h1>
              <p className="text-sm text-gray-600">School Management System</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Side - Project Information */}
        <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Modern School Management
              <span className="block text-blue-600">Made Simple</span>
            </h2>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              EduTrack is a comprehensive, multi-tenant school management system designed
              for the modern educational institution. Built with cutting-edge technology
              and a focus on user experience.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white/50 rounded-lg backdrop-blur-sm border border-white/20">
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>


          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <SignIn.Root>
              <SignIn.Step name="start" className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
                {/* Form Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="brightness-0 invert" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
                  <p className="text-gray-600">Sign in to access your dashboard</p>
                </div>

                <Clerk.GlobalError className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mb-4" />

                {/* Username Field */}
                <Clerk.Field name="identifier" className="mb-4">
                  <Clerk.Label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </Clerk.Label>
                  <Clerk.Input
                    type="text"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your username"
                  />
                  <Clerk.FieldError className="text-sm text-red-500 mt-1" />
                </Clerk.Field>

                {/* Password Field */}
                <Clerk.Field name="password" className="mb-6">
                  <Clerk.Label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </Clerk.Label>
                  <Clerk.Input
                    type="password"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <Clerk.FieldError className="text-sm text-red-500 mt-1" />
                </Clerk.Field>

                {/* Sign In Button */}
                <SignIn.Action
                  submit
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign In
                </SignIn.Action>

                {/* Role Information */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Access Levels:</h3>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Super Admin - Full system access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>School Admin - School management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span>Teacher - Class & student management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Parent - Student progress tracking</span>
                    </div>
                  </div>
                </div>
              </SignIn.Step>
            </SignIn.Root>

            {/* Mobile Features (shown only on mobile) */}
            <div className="lg:hidden mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 text-center">Key Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="bg-white/60 p-3 rounded-lg text-center">
                    <div className="text-xl mb-1">{feature.icon}</div>
                    <div className="text-xs font-medium text-gray-800">{feature.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© 2025 EduTrack. Built with ❤️ for modern educational institutions.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
