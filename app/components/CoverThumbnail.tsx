import React from 'react';
import { CoverData } from '../types';

interface CoverThumbnailProps {
  coverData: CoverData;
  className?: string;
}

export const CoverThumbnail: React.FC<CoverThumbnailProps> = ({ coverData, className = '' }) => {
  const { backgroundColor, width, height, textNodes } = coverData;

  // Calculate aspect ratio and scale factor
  const aspectRatio = width / height;
  const targetWidth = 384; // w-96 in Tailwind
  const targetHeight = targetWidth / aspectRatio;

  // Calculate scale factor for positioning text
  const scale = targetWidth / width;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 shadow-sm ${className}`}
      style={{
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        backgroundColor: `rgba(${backgroundColor.r * 255}, ${backgroundColor.g * 255}, ${backgroundColor.b * 255}, ${backgroundColor.a})`
      }}
    >
      {textNodes.map((textNode, index) => {
        const { characters, fontFamily, fontWeight, fontSize, color, textAlign, position } = textNode;

        if (!position) return null;

        // Scale position and size
        const scaledX = position.x * scale;
        const scaledY = position.y * scale;
        const scaledWidth = position.width * scale;
        const scaledFontSize = fontSize * scale;

        // Convert Figma textAlign to CSS
        const alignMap: Record<string, string> = {
          'LEFT': 'left',
          'CENTER': 'center',
          'RIGHT': 'right'
        };
        const textAlignCSS = alignMap[textAlign] || 'left';

        return (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              fontFamily: fontFamily || 'Pretendard',
              fontWeight: fontWeight || 400,
              fontSize: `${scaledFontSize}px`,
              color: `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`,
              textAlign: textAlignCSS as any,
              whiteSpace: 'pre-wrap',
              lineHeight: '1.2'
            }}
          >
            {characters}
          </div>
        );
      })}
    </div>
  );
};
