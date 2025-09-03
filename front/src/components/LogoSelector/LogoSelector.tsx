import React, { useState, useEffect } from 'react';
import './LogoSelector.css';
import Button from '../UI/Button/Button';
import { Logo } from '../../types';

interface LogoSelectorProps {
  onNext: (logos: Logo[]) => void;
  selectedLogos?: Logo[];
}

const LogoSelector: React.FC<LogoSelectorProps> = ({ onNext, selectedLogos = [] }) => {
  const [logos, setLogos] = useState<Logo[]>([
    {
      id: 1,
      name: 'F5',
      selected: false,
      icon: '🚀',
      imageUrl: '/logos/F5.jpeg'
    },
    {
      id: 2,
      name: 'Factoria F5',
      selected: false,
      icon: '🏭',
      imageUrl: '/logos/Factoria.jpeg'
    },
    {
      id: 3,
      name: 'SomosF5',
      selected: false,
      icon: '⭐',
      imageUrl: '/logos/somos F5.jpeg'
    },
    {
      id: 4,
      name: 'FemCoders',
      selected: false,
      icon: '👩‍💻',
      imageUrl: '/logos/fem coders.jpeg'
    },
    {
      id: 5,
      name: 'Fundacion Orange',
      selected: false,
      icon: '🍊',
      imageUrl: '/logos/Fundacion Orange.jpeg'
    },
    {
      id: 6,
      name: 'Microsoft',
      selected: false,
      icon: '🪟',
      imageUrl: '/logos/Microsoft.jpeg'
    }
  ]);

  const [imageLoadStatus, setImageLoadStatus] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Initialize selected logos if provided
    if (selectedLogos.length > 0) {
      setLogos(prevLogos => 
        prevLogos.map(logo => ({
          ...logo,
          selected: selectedLogos.some(selected => selected.id === logo.id)
        }))
      );
    }
  }, [selectedLogos]);

  const selectedCount = logos.filter(logo => logo.selected).length;

  const toggleLogo = (logoId: number) => {
    setLogos(prevLogos => 
      prevLogos.map(logo => 
        logo.id === logoId ? { ...logo, selected: !logo.selected } : logo
      )
    );
  };

  const selectAll = () => {
    setLogos(prevLogos => 
      prevLogos.map(logo => ({ ...logo, selected: true }))
    );
  };

  const deselectAll = () => {
    setLogos(prevLogos => 
      prevLogos.map(logo => ({ ...logo, selected: false }))
    );
  };

  const handleImageLoad = (logoId: number) => {
    console.log(`✅ Image loaded for logo ${logoId}`);
    setImageLoadStatus(prev => ({ ...prev, [logoId]: true }));
  };

  const handleImageError = (logoId: number, logoName: string) => {
    console.log(`❌ Error loading image for ${logoName} (ID: ${logoId})`);
    setImageLoadStatus(prev => ({ ...prev, [logoId]: false }));
  };

  const renderLogoIcon = (logo: Logo) => {
    // Always try to load image if imageUrl exists
    if (logo.imageUrl) {
      return (
        <img 
          src={logo.imageUrl} 
          alt={`${logo.name} logo`}
          className="logo-image"
          onLoad={() => handleImageLoad(logo.id)}
          onError={() => handleImageError(logo.id, logo.name)}
        />
      );
    }
    
    // Show emoji only if no imageUrl
    return <span className="logo-emoji">{logo.icon}</span>;
  };

  const handleLogoClick = (logoId: number) => {
    toggleLogo(logoId);
  };

  const handleNext = () => {
    const selectedLogos = logos.filter(logo => logo.selected);
    if (selectedLogos.length > 0) {
      onNext(selectedLogos);
    }
  };

  return (
    <div className="logo-selector">
      <div className="selector-header">
        <h3>Select Logos</h3>
        <p>Choose which logos you want to detect in the video</p>
        <div className="selection-info">
          Selected: {selectedCount} of {logos.length}
        </div>
      </div>

      <div className="selector-controls">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={selectAll}
        >
          Select All
        </Button>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={deselectAll}
        >
          Clear All
        </Button>
      </div>

      <div className="logos-grid">
        {logos.map(logo => (
          <div
            key={logo.id}
            className={`logo-card ${logo.selected ? 'selected' : ''}`}
            onClick={() => handleLogoClick(logo.id)}
          >
            <div className="logo-icon">
              {renderLogoIcon(logo)}
            </div>
            <div className="logo-name">{logo.name}</div>
            <div className="logo-checkbox">
              {logo.selected ? '✅' : '⬜'}
            </div>
          </div>
        ))}
      </div>

      <div className="selector-actions">
        <Button 
          variant="primary" 
          size="lg"
          onClick={handleNext}
          disabled={selectedCount === 0}
        >
          Continue with {selectedCount} Selected Logo{selectedCount !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
};

export default LogoSelector;
