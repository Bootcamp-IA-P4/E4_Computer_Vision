# MediaUpload Component

Компонент для загрузки как видео, так и изображений с поддержкой drag & drop.

## Возможности

- ✅ Загрузка видео файлов (MP4, AVI, MOV, MKV, WebM)
- ✅ Загрузка изображений (JPG, PNG, BMP)
- ✅ Drag & Drop интерфейс
- ✅ Отслеживание прогресса загрузки
- ✅ Валидация размера файлов (максимум 100MB)
- ✅ Визуальные индикаторы типа файла (🎬 для видео, 🖼️ для изображений)
- ✅ Обработка ошибок

## Использование

```tsx
import MediaUpload from './components/MediaUpload/MediaUpload';
import { MediaFile } from './types';

const MyComponent = () => {
  const handleMediaUpload = (files: MediaFile[]) => {
    console.log('Загружены файлы:', files);
  };

  return (
    <MediaUpload onMediaUpload={handleMediaUpload} />
  );
};
```

## Props

- `onMediaUpload: (files: MediaFile[]) => void` - Callback функция, вызываемая при успешной загрузке файлов

## Типы файлов

Компонент поддерживает следующие типы файлов:

### Видео
- MP4
- AVI
- MOV
- MKV
- WebM

### Изображения
- JPG/JPEG
- PNG
- BMP

## Состояния файлов

- `uploading` - файл загружается
- `uploaded` - файл успешно загружен
- `error` - ошибка при загрузке
- `processing` - файл обрабатывается на сервере
