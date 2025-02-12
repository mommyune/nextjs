"use client";

import { useEffect } from "react";
import "./stars.css";

{/* shadcn card */}
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Function to generate random stars
const generateStars = () => {
  const starCount = 100; // Number of stars to generate
  const starContainer = document.querySelector(".stars")!;
  
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    const size = Math.random() * 2 + 1; // Random star size between 1 and 3px
    const xPosition = Math.random() * 100; // Random horizontal position
    const yPosition = Math.random() * 100; // Random vertical position
    const animationDuration = Math.random() * 1.5 + 1.5; // Random animation speed for the shine effect
    
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${xPosition}%`;
    star.style.top = `${yPosition}%`;
    star.style.animationDuration = `${animationDuration}s`;

    star.classList.add("star");
    starContainer.appendChild(star);
  }
};

export default function Page() {

  useEffect(() => {
    generateStars();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative">
      {/* Stars container */}
      <div className="stars"></div>
      
      {/* Your content */}
      <div className="flex w-full max-w-sm flex-col gap-6 relative">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-center">Stars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              A simple no library star background for when you want a little noise on your background.
            </p>
            <p>
              Supports light & dark mode
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}