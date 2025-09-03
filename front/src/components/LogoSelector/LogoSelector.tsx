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
      imageUrl: '/logos/F5.jpg'
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
      console.log('🎯 LogoSelector: useEffect - initializing with selectedLogos:', selectedLogos);
      console.log('🎯 LogoSelector: Microsoft in provided selectedLogos:', 
        selectedLogos.find(logo => logo.name.toLowerCase().includes('microsoft')));
      
      setLogos(prevLogos => {
        const updatedLogos = prevLogos.map(logo => ({
          ...logo,
          selected: selectedLogos.some(selected => selected.id === logo.id)
        }));
        
        console.log('🎯 LogoSelector: Microsoft after initialization:', 
          updatedLogos.find(logo => logo.name.toLowerCase().includes('microsoft')));
        
        return updatedLogos;
      });
    }
  }, [selectedLogos]);

  const selectedCount = logos.filter(logo => logo.selected).length;

  const toggleLogo = (logoId: number) => {
    setLogos(prevLogos => {
      const updatedLogos = prevLogos.map(logo => 
        logo.id === logoId ? { ...logo, selected: !logo.selected } : logo
      );
      
      // Специальная отладка для Microsoft
      const microsoftLogo = updatedLogos.find(logo => logo.name.toLowerCase().includes('microsoft'));
      if (microsoftLogo) {
        console.log('🎯 LogoSelector: Microsoft logo toggled:', {
          logoId: microsoftLogo.id,
          name: microsoftLogo.name,
          selected: microsoftLogo.selected
        });
      }
      
      return updatedLogos;
    });
  };

  const selectAll = () => {
    setLogos(prevLogos => {
      const updatedLogos = prevLogos.map(logo => ({ ...logo, selected: true }));
      console.log('🎯 LogoSelector: selectAll called, Microsoft should be selected:', 
        updatedLogos.find(logo => logo.name.toLowerCase().includes('microsoft'))?.selected);
      return updatedLogos;
    });
  };

  const deselectAll = () => {
    setLogos(prevLogos => {
      const updatedLogos = prevLogos.map(logo => ({ ...logo, selected: false }));
      console.log('🎯 LogoSelector: deselectAll called, Microsoft should be deselected:', 
        updatedLogos.find(logo => logo.name.toLowerCase().includes('microsoft'))?.selected);
      return updatedLogos;
    });
  };

  const handleImageLoad = (logoId: number) => {
    console.log(`✅ Image loaded for logo ${logoId}`);
    
    // Специальная отладка для Microsoft
    const microsoftLogo = logos.find(logo => logo.id === logoId && logo.name.toLowerCase().includes('microsoft'));
    if (microsoftLogo) {
      console.log('🎯 LogoSelector: Microsoft image loaded successfully:', {
        id: microsoftLogo.id,
        name: microsoftLogo.name,
        imageUrl: microsoftLogo.imageUrl
      });
    }

    // Специальная отладка для F5
    const f5Logo = logos.find(logo => logo.id === logoId && logo.name.toLowerCase().includes('f5') && logo.name.length <= 3);
    if (f5Logo) {
      console.log('🎯 LogoSelector: F5 image loaded successfully:', {
        id: f5Logo.id,
        name: f5Logo.name,
        imageUrl: f5Logo.imageUrl
      });
    }
    
    setImageLoadStatus(prev => ({ ...prev, [logoId]: true }));
  };

  const handleImageError = (logoId: number, logoName: string) => {
    console.log(`❌ Error loading image for ${logoName} (ID: ${logoId})`);
    
    // Специальная отладка для Microsoft
    if (logoName.toLowerCase().includes('microsoft')) {
      console.log('🎯 LogoSelector: Microsoft image failed to load:', {
        id: logoId,
        name: logoName
      });
    }

    // Специальная отладка для F5
    if (logoName.toLowerCase().includes('f5') && logoName.length <= 3) {
      console.log('🎯 LogoSelector: F5 image failed to load:', {
        id: logoId,
        name: logoName
      });
    }
    
    setImageLoadStatus(prev => ({ ...prev, [logoId]: false }));
  };

  const renderLogoIcon = (logo: Logo) => {
    // Специальная отладка для Microsoft
    if (logo.name.toLowerCase().includes('microsoft')) {
      console.log('🎯 LogoSelector: renderLogoIcon for Microsoft:', {
        id: logo.id,
        name: logo.name,
        imageUrl: logo.imageUrl,
        icon: logo.icon
      });
    }

    // Специальная отладка для F5
    if (logo.name.toLowerCase().includes('f5') && logo.name.length <= 3) {
      console.log('🎯 LogoSelector: renderLogoIcon for F5:', {
        id: logo.id,
        name: logo.name,
        imageUrl: logo.imageUrl,
        icon: logo.icon
      });
    }
    
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
    console.log('🎯 LogoSelector: handleNext called with selectedLogos:', selectedLogos);
    console.log('🎯 LogoSelector: Microsoft in selected logos:', selectedLogos.find(logo => logo.name.toLowerCase().includes('microsoft')));
    
    // Дополнительная отладка для Microsoft
    const microsoftLogo = logos.find(logo => logo.name.toLowerCase().includes('microsoft'));
    console.log('🎯 LogoSelector: Microsoft logo state:', {
      id: microsoftLogo?.id,
      name: microsoftLogo?.name,
      selected: microsoftLogo?.selected,
      imageUrl: microsoftLogo?.imageUrl
    });
    
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
        {logos.map(logo => {
          // Специальная отладка для Microsoft
          if (logo.name.toLowerCase().includes('microsoft')) {
            console.log('🎯 LogoSelector: Rendering Microsoft logo:', {
              id: logo.id,
              name: logo.name,
              selected: logo.selected,
              imageUrl: logo.imageUrl
            });
          }
          
          return (
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
          );
        })}
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
