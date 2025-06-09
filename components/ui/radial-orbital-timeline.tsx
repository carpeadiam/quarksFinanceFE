"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Link, Zap } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number }>({ x: -150, y: 0 });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  //Get the current feature
  const currentFeature = timelineData[currentFeatureIndex];

  // Function to go to next feature
  const nextFeature = () => {
    setCurrentFeatureIndex((prev) => (prev + 1) % timelineData.length);
    updatePulseEffects(timelineData[(currentFeatureIndex + 1) % timelineData.length].id);
  };

  // Function to go to previous feature
  const prevFeature = () => {
    const newIndex = currentFeatureIndex === 0 ? timelineData.length - 1 : currentFeatureIndex - 1;
    setCurrentFeatureIndex(newIndex);
    updatePulseEffects(timelineData[newIndex].id);
  };

  // Update pulse effects for related items
  const updatePulseEffects = (itemId: number) => {
    const relatedItems = getRelatedItems(itemId);
    const newPulseEffect: Record<number, boolean> = {};
    relatedItems.forEach((relId) => {
      newPulseEffect[relId] = true;
    });
    setPulseEffect(newPulseEffect);
  };

  // Handle auto rotation
  useEffect(() => {
    if (autoRotate) {
      timerRef.current = setInterval(() => {
        nextFeature();
      }, 5000); // 5 seconds timer
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRotate, currentFeatureIndex]);

  // Orbital rotation effect
  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate]);

  // Pause auto-rotation when user interacts with controls
  const handleNavigation = (callback: () => void) => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Execute the navigation
    callback();
    
    // Temporarily pause auto-rotation
    setAutoRotate(false);
    
    // Resume auto-rotation after 10 seconds of inactivity
    setTimeout(() => {
      setAutoRotate(true);
    }, 10000);
  };

  // Get related features
  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    const relatedItems = getRelatedItems(currentFeature.id);
    return relatedItems.includes(itemId);
  };

  // Calculate node position for orbital display
  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 210;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x + 145;
    const y = radius * Math.sin(radian) + centerOffset.y - 0.5;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  // Get status styles
  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-white bg-black border-white";
      case "in-progress":
        return "text-black bg-white border-black";
      case "pending":
        return "text-white bg-black/40 border-white/50";
      default:
        return "text-white bg-black/40 border-white/50";
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center ">
      <div className="relative w-full max-w-7xl h-full flex items-center">
        {/* Left side: Orbital Timeline */}
        <div className="relative w-1/2 h-full flex items-center justify-center">
          <div
            className="absolute w-full h-full flex items-center justify-center"
            ref={orbitRef}
            style={{
              perspective: "1000px",
              transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
            }}
          >
            {/* Center element */}
            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 animate-pulse flex items-center justify-center z-10">
              <div className="absolute w-20 h-20 rounded-full border border-white/20 animate-ping opacity-70"></div>
              <div
                className="absolute w-24 h-24 rounded-full border border-white/10 animate-ping opacity-50"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-md"></div>
            </div>

            {/* Orbital ring */}
            <div className="absolute w-[420px] h-[420px] rounded-full border border-black/20"></div>

            {/* Orbital nodes */}
            {timelineData.map((item, index) => {
              const position = calculateNodePosition(index, timelineData.length);
              const isActive = index === currentFeatureIndex;
              const isRelated = isRelatedToActive(item.id);
              const isPulsing = pulseEffect[item.id];
              const Icon = item.icon;

              const nodeStyle = {
                transform: `translate(${position.x}px, ${position.y}px)`,
                zIndex: isActive ? 200 : position.zIndex,
                opacity: isActive ? 1 : position.opacity,
              };

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    nodeRefs.current[item.id] = el;
                  }}
                  className="absolute transition-all duration-700 cursor-pointer"
                  style={nodeStyle}
                  onClick={() => handleNavigation(() => setCurrentFeatureIndex(index))}
                >
                  <div
                    className={`absolute rounded-full -inset-1 ${isPulsing ? "animate-pulse duration-1000" : ""}`}
                    style={{
                      background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
                      width: `${item.energy * 0.5 + 40}px`,
                      height: `${item.energy * 0.5 + 40}px`,
                      left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                      top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    }}
                  ></div>

                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isActive
                        ? "bg-white text-black"
                        : isRelated
                        ? "bg-white/50 text-black"
                        : "bg-black text-white"
                    }
                    border-2 
                    ${isActive
                        ? "border-white shadow-lg shadow-white/30"
                        : isRelated
                        ? "border-white animate-pulse"
                        : "border-white/40"
                    }
                    transition-all duration-300 transform
                    ${isActive ? "scale-150" : ""}
                  `}
                  >
                    <Icon size={16} />
                  </div>

                  <div
                    className={`
                    absolute top-12 whitespace-nowrap
                    text-xs font-semibold tracking-wider
                    transition-all duration-300
                    ${isActive ? "text-black scale-125" : "text-black/70"}
                  `}
                  >
                    {item.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: Feature Details Panel */}
        <div className="w-1/2 h-full flex items-center justify-center">
          <div className="w-full max-w-md px-8 transition-opacity duration-300 opacity-100">
            <Card className="w-full bg-white/90 backdrop-blur-lg border-blue-100 shadow-xl overflow-visible">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge
                    className={`px-2 text-xs ${currentFeature.status === "completed"
                      ? "text-white bg-blue-600 border-blue-600"
                      : currentFeature.status === "in-progress"
                      ? "text-blue-700 bg-blue-50 border-blue-200"
                      : "text-gray-600 bg-gray-100 border-gray-200"}`}
                  >
                    {currentFeature.status === "completed"
                      ? "COMPLETE"
                      : currentFeature.status === "in-progress"
                      ? "IN PROGRESS"
                      : "PENDING"}
                  </Badge>
                  <span className="text-xs font-mono text-gray-500">
                    {currentFeature.date}
                  </span>
                </div>
                <CardTitle className="text-xl mt-2 text-blue-900">
                  {currentFeature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700">
                <p className="text-base">{currentFeature.content}</p>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="flex items-center">
                      <Zap size={14} className="mr-2 text-yellow-500" />
                      Energy Level
                    </span>
                    <span className="font-mono">{currentFeature.energy}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${currentFeature.energy}%` }}
                    ></div>
                  </div>
                </div>

                {currentFeature.relatedIds.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center mb-3">
                      <Link size={14} className="text-gray-500 mr-2" />
                      <h4 className="text-sm uppercase tracking-wider font-medium text-gray-500">
                        Connected Features
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentFeature.relatedIds.map((relatedId) => {
                        const relatedItem = timelineData.find(
                          (i) => i.id === relatedId
                        );
                        if (!relatedItem) return null;
                        return (
                          <Button
                            key={relatedId}
                            variant="outline"
                            size="sm"
                            className="flex items-center h-8 px-3 py-0 text-sm rounded-md border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-all"
                            onClick={() => {
                              const index = timelineData.findIndex(item => item.id === relatedId);
                              if (index !== -1) {
                                handleNavigation(() => setCurrentFeatureIndex(index));
                              }
                            }}
                          >
                            {relatedItem.title}
                            <ArrowRight
                              size={12}
                              className="ml-2 text-gray-400"
                            />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Navigation Controls */}
                <div className="mt-8 flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="rounded-full w-10 h-10 border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    onClick={() => handleNavigation(prevFeature)}
                  >
                    <ArrowLeft size={20} />
                  </Button>
                  
                  <div className="flex gap-1">
                    {timelineData.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentFeatureIndex ? 'bg-blue-600 w-4' : 'bg-gray-300'}`}
                        onClick={() => handleNavigation(() => setCurrentFeatureIndex(index))}
                      />
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="rounded-full w-10 h-10 border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    onClick={() => handleNavigation(nextFeature)}
                  >
                    <ArrowRight size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}