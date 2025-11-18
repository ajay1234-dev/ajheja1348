import { useRef, useState, useEffect } from "react";
import "./scroll-gradients.css";

interface ScrollGradientsProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  hideScrollbar?: boolean;
  maxHeight?: string;
  height?: string;
}

const ScrollGradients = ({
  children,
  className = "",
  contentClassName = "",
  hideScrollbar = false,
  maxHeight = "400px",
  height = "100%",
}: ScrollGradientsProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
    );
  };

  // Initialize gradient states
  useEffect(() => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      setTopGradientOpacity(Math.min(scrollTop / 50, 1));
      const bottomDistance = scrollHeight - (scrollTop + clientHeight);
      setBottomGradientOpacity(
        scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
      );
    }
  }, []);

  return (
    <div
      className={`scroll-container ${className}`}
      style={{ height, maxHeight }}
    >
      <div
        ref={contentRef}
        className={`scroll-content ${
          hideScrollbar ? "no-scrollbar" : ""
        } ${contentClassName}`}
        onScroll={handleScroll}
        style={{ height, maxHeight }}
      >
        {children}
      </div>
      <div
        className="scroll-gradient-top"
        style={{ opacity: topGradientOpacity }}
      ></div>
      <div
        className="scroll-gradient-bottom"
        style={{ opacity: bottomGradientOpacity }}
      ></div>
    </div>
  );
};

export default ScrollGradients;
