import React from 'react';
import './BrandLogo.css';

interface BrandLogoProps {
  brandName: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ brandName, size = 'medium', className = '' }) => {
  // Маппинг названий брендов на файлы логотипов
  const getLogoPath = (name: string): string => {
    const logoMap: { [key: string]: string } = {
      'F5': 'F5.jpeg',
      'Factoria': 'Factoria.jpeg',
      'FemCoders': 'fem coders.jpeg',
      'Fundacion Orange': 'Fundacion Orange.jpeg',
      'Microsoft': 'Microsoft.jpeg',
      'SomosF5': 'somos F5.jpeg'
    };

    // Попробуем найти точное совпадение
    if (logoMap[name]) {
      return `/logos/${logoMap[name]}`;
    }

    // Попробуем найти частичное совпадение (для разных регистров)
    const normalizedName = name.toLowerCase();
    for (const [key, value] of Object.entries(logoMap)) {
      if (key.toLowerCase() === normalizedName) {
        return `/logos/${value}`;
      }
    }

    // Если не найдено, возвращаем дефолтный логотип
    return '/logos/Factoria.jpeg'; // Дефолтный логотип
  };

  const logoPath = getLogoPath(brandName);

  return (
    <div className={`brand-logo ${size} ${className}`}>
      <img 
        src={logoPath} 
        alt={brandName}
        className="brand-logo-image"
        onError={(e) => {
          // Fallback на дефолтный логотип если изображение не загрузилось
          const target = e.target as HTMLImageElement;
          target.src = '/logos/Factoria.jpeg';
        }}
      />
    </div>
  );
};

export default BrandLogo;
