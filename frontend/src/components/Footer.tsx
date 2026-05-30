import React from "react";
import { Film } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#070707] border-t border-neutral-900 text-muted py-12 px-6 font-poppins">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <span className="flex items-center gap-2 text-2xl font-black text-primary tracking-wider  mb-4">
            <Film className="w-6 h-6 text-primary" />
            CineCircle
          </span>
          <p className="text-sm text-neutral-500 font-inter leading-relaxed">
            Revolutionizing the way you plan and book movie experiences.
            Deciding, coordinating, and booking tickets with friends has never
            been this seamless.
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4">Explore</h4>
          <ul className="text-sm font-inter space-y-2">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Now Showing
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Coming Soon
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Group Rooms
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Cinemas
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4">Company</h4>
          <ul className="text-sm font-inter space-y-2">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Careers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4">
            Contact & Support
          </h4>
          <p className="text-sm font-inter text-neutral-500 mb-2">
            Have questions or feedback?
          </p>
          <a
            href="mailto:support@cinecircle.com"
            className="text-primary hover:underline text-sm font-semibold"
          >
            support@cinecircle.com
          </a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto border-t border-neutral-900 mt-8 pt-6 flex flex-col md:flex-row justify-between text-xs text-neutral-600 font-inter">
        <p>
          © 2026 CineCircle. Designed with cinematic passion. All rights
          reserved.
        </p>
        <p>DBMS Mini Project Presentation Ready.</p>
      </div>
    </footer>
  );
};
