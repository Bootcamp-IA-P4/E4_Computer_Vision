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
      'F5': 'F5.jpg',
      'Factoria': 'Factoria.jpeg',
      'FemCoders': 'fem coders.jpeg',
      'Fundacion Orange': 'Fundacion Orange.jpeg',
      'Microsoft': 'Microsoft.jpeg',
      'SomosF5': 'somos F5.jpeg'
    };

    // Специальная отладка для Microsoft
    if (name.toLowerCase().includes('microsoft')) {
      console.log('🎨 BrandLogo: Microsoft logo path lookup:', {
        name: name,
        exactMatch: logoMap[name],
        logoMap: logoMap
      });
    }

    // Специальная отладка для FemCoders
    if (name.toLowerCase().includes('femcoders')) {
      console.log('🎨 BrandLogo: FemCoders logo path lookup:', {
        name: name,
        exactMatch: logoMap[name],
        logoMap: logoMap
      });
    }

    // Специальная отладка для F5
    if (name.toLowerCase().includes('f5') && name.length <= 3) {
      console.log('🎨 BrandLogo: F5 logo path lookup:', {
        name: name,
        exactMatch: logoMap[name],
        logoMap: logoMap
      });
    }

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

  // Специальная отладка для Microsoft
  if (brandName.toLowerCase().includes('microsoft')) {
    console.log('🎨 BrandLogo: Rendering Microsoft logo:', {
      brandName: brandName,
      logoPath: logoPath,
      size: size,
      className: className
    });
  }

  // Специальная отладка для FemCoders
  if (brandName.toLowerCase().includes('femcoders')) {
    console.log('🎨 BrandLogo: Rendering FemCoders logo:', {
      brandName: brandName,
      logoPath: logoPath,
      size: size,
      className: className
    });
  }

  // Специальная отладка для F5
  if (brandName.toLowerCase().includes('f5') && brandName.length <= 3) {
    console.log('🎨 BrandLogo: Rendering F5 logo:', {
      brandName: brandName,
      logoPath: logoPath,
      size: size,
      className: className
    });
  }

  return (
    <div className={`brand-logo ${size} ${className}`}>
      <img 
        src={logoPath} 
        alt={brandName}
        className="brand-logo-image"
        onError={(e) => {
          // Fallback на дефолтный логотип если изображение не загрузилось
          const target = e.target as HTMLImageElement;
          console.log('🎨 BrandLogo: Image failed to load:', {
            brandName: brandName,
            logoPath: logoPath,
            fallbackTo: '/logos/Factoria.jpeg'
          });
          target.src = '/logos/Factoria.jpeg';
        }}
      />
    </div>
  );
};

export default BrandLogo;
