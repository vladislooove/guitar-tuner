import React from "react";
import { Github, Guitar } from "lucide-react";
import GuitarTuner from "@/components/GuitarTuner";

const Index = () => {
  return (
    <div className="min-h-screen py-8 bg-gray-950">
      <div className="container mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <Guitar size={32} className="text-gray-300 mr-3" />
            <h1 className="text-4xl font-bold text-gray-200">
              Professional Guitar Tuner
            </h1>
          </div>
          <p className="text-gray-500">
            Precision tuning for professional musicians
          </p>
        </header>

        <GuitarTuner />

        <footer className="mt-16 text-center text-gray-600 text-sm">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span>© {new Date().getFullYear()} Guitar Tuner</span>
            <span className="text-gray-700">|</span>
            <a
              href="https://github.com"
              className="flex items-center hover:text-gray-300 transition-colors"
            >
              <Github size={14} className="mr-1" />
              <span>Source</span>
            </a>
          </div>
          <p>Accurate tuning for professionals.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
