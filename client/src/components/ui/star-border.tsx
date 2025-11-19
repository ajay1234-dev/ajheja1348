import "./star-border.css";
import React from "react";

const StarBorder = ({
  as: Component = "div",
  className = "",
  color = "cyan",
  speed = "5s",
  thickness = 4, // Increased thickness to 4px for better visibility
  children,
  ...rest
}: {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children: React.ReactNode;
} & Omit<React.HTMLProps<HTMLElement>, "className" | "children" | "color" | "as">) => {
  return (
    <Component className={`star-border-container ${className}`} {...rest}>
      <div
        className="star-border-top"
        style={{
          height: `${thickness}px`,
          animationDuration: speed,
          background: color,
        }}
      ></div>
      <div
        className="star-border-bottom"
        style={{
          height: `${thickness}px`,
          animationDuration: speed,
          background: color,
        }}
      ></div>
      <div className="star-border-content">{children}</div>
    </Component>
  );
};

export default StarBorder;
