import numpy as np
import cv2
import base64
import io
from typing import List, Dict, Tuple, Optional
import logging
from collections import defaultdict
import json

logger = logging.getLogger(__name__)

class HeatmapGenerator:
    def __init__(self):
        # Фиолетовая цветовая схема для тепловых карт (4 уровня)
        self.heatmap_colors = [
            (255, 255, 255), # Белый - нет данных (0%)
            (220, 200, 255), # Светло-фиолетовый - низкая интенсивность (1-33%)
            (140, 80, 255),  # Средне-фиолетовый - средняя интенсивность (34-66%)
            (80, 0, 200)     # Темно-фиолетовый - высокая интенсивность (67-100%)
        ]
    
    def generate_heatmap_data(self, detections: List[Dict], video_width: int, video_height: int, 
                            grid_size: int = 50, brand_filter: Optional[str] = None, 
                            background_type: str = 'transparent', smooth_factor: float = 1.0) -> Dict:
        """
        Генерирует данные тепловой карты на основе детекций
        
        Args:
            detections: Список детекций с координатами bbox
            video_width: Ширина видео
            video_height: Высота видео
            grid_size: Размер сетки для агрегации (по умолчанию 50x50)
            brand_filter: Фильтр по названию бренда (опционально)
        
        Returns:
            Словарь с данными тепловой карты
        """
        try:
            # Фильтруем детекции по бренду если указан
            if brand_filter:
                filtered_detections = [
                    d for d in detections 
                    if d.get('brand_name', '').lower() == brand_filter.lower()
                ]
            else:
                filtered_detections = detections
            
            if not filtered_detections:
                return self._create_empty_heatmap_data(video_width, video_height, grid_size)
            
            # Создаем сетку для агрегации
            grid_width = video_width // grid_size
            grid_height = video_height // grid_size
            
            # Инициализируем матрицу интенсивности
            intensity_matrix = np.zeros((grid_height, grid_width), dtype=np.float32)
            
            # Агрегируем детекции по сетке
            for detection in filtered_detections:
                bbox = detection.get('bbox', [])
                if len(bbox) >= 4:
                    x1, y1, x2, y2 = bbox[:4]
                    
                    # Вычисляем центр детекции
                    center_x = (x1 + x2) / 2
                    center_y = (y1 + y2) / 2
                    
                    # Определяем ячейку сетки
                    grid_x = min(int(center_x // grid_size), grid_width - 1)
                    grid_y = min(int(center_y // grid_size), grid_height - 1)
                    
                    # Увеличиваем интенсивность в этой ячейке
                    intensity_matrix[grid_y, grid_x] += 1
            
            # Нормализуем интенсивность (0-1)
            max_intensity = np.max(intensity_matrix)
            if max_intensity > 0:
                intensity_matrix = intensity_matrix / max_intensity
            
            # Создаем тепловую карту
            heatmap_image = self._create_heatmap_image(intensity_matrix, grid_size, background_type, smooth_factor)
            
            # Конвертируем в base64 для передачи в frontend
            heatmap_base64 = self._image_to_base64(heatmap_image, background_type)
            
            # Создаем данные для frontend
            heatmap_data = {
                'heatmap_image': heatmap_base64,
                'intensity_matrix': intensity_matrix.tolist(),
                'grid_size': grid_size,
                'video_dimensions': {
                    'width': video_width,
                    'height': video_height
                },
                'grid_dimensions': {
                    'width': grid_width,
                    'height': grid_height
                },
                'statistics': {
                    'total_detections': len(filtered_detections),
                    'max_intensity': float(max_intensity),
                    'active_cells': int(np.count_nonzero(intensity_matrix)),
                    'total_cells': grid_width * grid_height
                },
                'brand_filter': brand_filter
            }
            
            logger.info(f"Generated heatmap with {len(filtered_detections)} detections, "
                       f"max intensity: {max_intensity}, active cells: {int(np.count_nonzero(intensity_matrix))}")
            
            return heatmap_data
            
        except Exception as e:
            logger.error(f"Error generating heatmap data: {e}")
            return self._create_empty_heatmap_data(video_width, video_height, grid_size)
    
    def _create_heatmap_image(self, intensity_matrix: np.ndarray, grid_size: int, background_type: str = 'transparent', smooth_factor: float = 1.0) -> np.ndarray:
        """
        Создает профессиональную тепловую карту с плавными градиентами
        
        Args:
            intensity_matrix: Матрица интенсивности
            grid_size: Размер ячейки сетки
            background_type: Тип фона ('transparent', 'white', 'gradient', 'dark')
        """
        try:
            height, width = intensity_matrix.shape
            image_height = height * grid_size
            image_width = width * grid_size
            
            # Создаем изображение с альфа-каналом для прозрачности
            heatmap_image = np.zeros((image_height, image_width, 4), dtype=np.uint8)
            
            # Устанавливаем фон в зависимости от типа
            if background_type == 'transparent':
                # Прозрачный фон
                heatmap_image[:, :, 3] = 0  # Альфа = 0 (полностью прозрачный)
            elif background_type == 'white':
                # Белый фон
                heatmap_image[:, :, :3] = [255, 255, 255]  # Белый цвет
                heatmap_image[:, :, 3] = 255  # Непрозрачный
            elif background_type == 'gradient':
                # Градиентный фон от светло-серого к белому
                for y in range(image_height):
                    intensity = y / image_height
                    gray_value = int(240 + intensity * 15)  # От 240 до 255
                    heatmap_image[y, :, :3] = [gray_value, gray_value, gray_value]
                heatmap_image[:, :, 3] = 255
            elif background_type == 'dark':
                # Темно-серый фон
                heatmap_image[:, :, :3] = [45, 45, 45]  # Темно-серый
                heatmap_image[:, :, 3] = 255
            elif background_type == 'purple':
                # Фиолетовый градиентный фон
                for y in range(image_height):
                    intensity = y / image_height
                    # Градиент от светло-фиолетового к темно-фиолетовому
                    r = int(240 - intensity * 40)  # От 240 до 200
                    g = int(240 - intensity * 80)  # От 240 до 160
                    b = int(255 - intensity * 20)  # От 255 до 235
                    heatmap_image[y, :, :3] = [r, g, b]
                heatmap_image[:, :, 3] = 255
            else:
                # По умолчанию - прозрачный
                heatmap_image[:, :, 3] = 0
            
            # Создаем плавную тепловую карту
            if np.max(intensity_matrix) > 0:
                # Увеличиваем разрешение для плавности
                scale_factor = 4
                smooth_height = height * scale_factor
                smooth_width = width * scale_factor
                
                # Создаем увеличенную матрицу
                smooth_matrix = np.zeros((smooth_height, smooth_width))
                
                # Заполняем увеличенную матрицу
                for y in range(height):
                    for x in range(width):
                        intensity = intensity_matrix[y, x]
                        if intensity > 0:
                            # Создаем плавный переход в увеличенной области
                            start_y = y * scale_factor
                            end_y = start_y + scale_factor
                            start_x = x * scale_factor
                            end_x = start_x + scale_factor
                            
                            # Создаем градиент внутри ячейки
                            for sy in range(start_y, end_y):
                                for sx in range(start_x, end_x):
                                    # Расстояние от центра ячейки
                                    center_y = start_y + scale_factor // 2
                                    center_x = start_x + scale_factor // 2
                                    distance = np.sqrt((sy - center_y)**2 + (sx - center_x)**2)
                                    max_distance = scale_factor // 2
                                    
                                    # Плавное затухание от центра
                                    if distance <= max_distance:
                                        falloff = 1.0 - (distance / max_distance) * 0.3  # 30% затухание
                                        smooth_matrix[sy, sx] = intensity * falloff
                
                # Применяем гауссово размытие для еще большей плавности
                if smooth_height > 10 and smooth_width > 10:
                    blur_size = max(3, int(5 * smooth_factor))
                    if blur_size % 2 == 0:
                        blur_size += 1  # Гауссово размытие требует нечетный размер
                    sigma = 1.0 * smooth_factor
                    smooth_matrix = cv2.GaussianBlur(smooth_matrix, (blur_size, blur_size), sigma)
                
                # Масштабируем обратно к размеру изображения
                cell_height = image_height // height
                cell_width = image_width // width
                
                for y in range(height):
                    for x in range(width):
                        # Получаем среднее значение из увеличенной области
                        start_y = y * scale_factor
                        end_y = start_y + scale_factor
                        start_x = x * scale_factor
                        end_x = start_x + scale_factor
                        
                        avg_intensity = np.mean(smooth_matrix[start_y:end_y, start_x:end_x])
                        
                        if avg_intensity > 0.01:  # Порог для отображения
                            # Определяем цвет на основе интенсивности
                            color = self._get_heatmap_color(avg_intensity)
                            
                            # Заполняем ячейку сетки
                            start_y_img = y * cell_height
                            end_y_img = start_y_img + cell_height
                            start_x_img = x * cell_width
                            end_x_img = start_x_img + cell_width
                            
                            # Создаем плавный градиент внутри ячейки
                            for sy in range(start_y_img, end_y_img):
                                for sx in range(start_x_img, end_x_img):
                                    # Расстояние от центра ячейки
                                    center_y = start_y_img + cell_height // 2
                                    center_x = start_x_img + cell_width // 2
                                    distance = np.sqrt((sy - center_y)**2 + (sx - center_x)**2)
                                    max_distance = min(cell_height, cell_width) // 2
                                    
                                    if distance <= max_distance:
                                        # Плавное затухание от центра
                                        falloff = 1.0 - (distance / max_distance) * 0.4  # 40% затухание
                                        
                                        # Применяем цвет с учетом затухания
                                        alpha = int((180 + avg_intensity * 75) * falloff)
                                        if alpha > 0:
                                            heatmap_image[sy, sx, :3] = color
                                            heatmap_image[sy, sx, 3] = alpha
            
            return heatmap_image
            
        except Exception as e:
            logger.error(f"Error creating heatmap image: {e}")
            return np.zeros((100, 100, 4), dtype=np.uint8)
    
    def _get_heatmap_color(self, intensity: float) -> Tuple[int, int, int]:
        """
        Возвращает плавно интерполированный цвет для заданной интенсивности
        """
        if intensity <= 0:
            return (255, 255, 255)  # Белый для нулевой интенсивности (нет данных)
        
        # Нормализуем интенсивность
        intensity = min(max(intensity, 0.0), 1.0)
        
        # Вычисляем позицию в цветовой шкале (начинаем с индекса 1, так как 0 - это "нет данных")
        color_scale_position = intensity * (len(self.heatmap_colors) - 2) + 1
        
        # Определяем индексы для интерполяции
        lower_index = int(color_scale_position)
        upper_index = min(lower_index + 1, len(self.heatmap_colors) - 1)
        
        # Вычисляем веса для интерполяции
        weight = color_scale_position - lower_index
        
        # Интерполируем между цветами
        lower_color = self.heatmap_colors[lower_index]
        upper_color = self.heatmap_colors[upper_index]
        
        interpolated_color = (
            int(lower_color[0] + weight * (upper_color[0] - lower_color[0])),
            int(lower_color[1] + weight * (upper_color[1] - lower_color[1])),
            int(lower_color[2] + weight * (upper_color[2] - lower_color[2]))
        )
        
        return interpolated_color
    
    def _image_to_base64(self, image: np.ndarray, background_type: str = 'transparent') -> str:
        """
        Конвертирует изображение OpenCV в base64 строку
        
        Args:
            image: Изображение (может быть с альфа-каналом)
            background_type: Тип фона для определения формата
        """
        try:
            # Если изображение имеет альфа-канал (4 канала)
            if image.shape[2] == 4:
                # Конвертируем BGRA в RGBA
                image_rgba = cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA)
                
                # Кодируем в PNG для поддержки прозрачности
                _, buffer = cv2.imencode('.png', image_rgba)
                
                # Конвертируем в base64
                image_base64 = base64.b64encode(buffer).decode('utf-8')
                
                return f"data:image/png;base64,{image_base64}"
            else:
                # Обычное изображение без альфа-канала
                # Конвертируем BGR в RGB
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Кодируем в JPEG
                _, buffer = cv2.imencode('.jpg', image_rgb)
                
                # Конвертируем в base64
                image_base64 = base64.b64encode(buffer).decode('utf-8')
                
                return f"data:image/jpeg;base64,{image_base64}"
            
        except Exception as e:
            logger.error(f"Error converting image to base64: {e}")
            return ""
    
    def _create_empty_heatmap_data(self, video_width: int, video_height: int, grid_size: int) -> Dict:
        """
        Создает пустые данные тепловой карты
        """
        grid_width = video_width // grid_size
        grid_height = video_height // grid_size
        
        return {
            'heatmap_image': "",
            'intensity_matrix': np.zeros((grid_height, grid_width)).tolist(),
            'grid_size': grid_size,
            'video_dimensions': {
                'width': video_width,
                'height': video_height
            },
            'grid_dimensions': {
                'width': grid_width,
                'height': grid_height
            },
            'statistics': {
                'total_detections': 0,
                'max_intensity': 0.0,
                'active_cells': 0,
                'total_cells': grid_width * grid_height
            },
            'brand_filter': None
        }
    
    def generate_temporal_heatmap(self, detections: List[Dict], video_width: int, video_height: int,
                                video_duration: float, time_bins: int = 20) -> Dict:
        """
        Генерирует временную тепловую карту, показывающую интенсивность детекций по времени
        
        Args:
            detections: Список детекций
            video_width: Ширина видео
            video_height: Высота видео
            video_duration: Длительность видео в секундах
            time_bins: Количество временных интервалов
        
        Returns:
            Словарь с данными временной тепловой карты
        """
        try:
            if not detections or video_duration <= 0:
                return self._create_empty_temporal_heatmap(video_duration, time_bins)
            
            # Создаем временные интервалы
            time_interval = video_duration / time_bins
            temporal_data = []
            
            for i in range(time_bins):
                start_time = i * time_interval
                end_time = (i + 1) * time_interval
                
                # Фильтруем детекции по времени
                time_detections = [
                    d for d in detections
                    if start_time <= d.get('t_start', 0) < end_time
                ]
                
                temporal_data.append({
                    'time_start': start_time,
                    'time_end': end_time,
                    'detection_count': len(time_detections),
                    'detections': time_detections
                })
            
            # Вычисляем статистики
            max_detections = max([data['detection_count'] for data in temporal_data])
            total_detections = sum([data['detection_count'] for data in temporal_data])
            
            return {
                'temporal_data': temporal_data,
                'time_bins': time_bins,
                'time_interval': time_interval,
                'video_duration': video_duration,
                'statistics': {
                    'total_detections': total_detections,
                    'max_detections_per_bin': max_detections,
                    'average_detections_per_bin': total_detections / time_bins if time_bins > 0 else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating temporal heatmap: {e}")
            return self._create_empty_temporal_heatmap(video_duration, time_bins)
    
    def _create_empty_temporal_heatmap(self, video_duration: float, time_bins: int) -> Dict:
        """
        Создает пустые данные временной тепловой карты
        """
        time_interval = video_duration / time_bins if time_bins > 0 else 1
        
        temporal_data = []
        for i in range(time_bins):
            start_time = i * time_interval
            end_time = (i + 1) * time_interval
            temporal_data.append({
                'time_start': start_time,
                'time_end': end_time,
                'detection_count': 0,
                'detections': []
            })
        
        return {
            'temporal_data': temporal_data,
            'time_bins': time_bins,
            'time_interval': time_interval,
            'video_duration': video_duration,
            'statistics': {
                'total_detections': 0,
                'max_detections_per_bin': 0,
                'average_detections_per_bin': 0
            }
        }
    
    def generate_brand_distribution_heatmap(self, detections: List[Dict], video_width: int, video_height: int) -> Dict:
        """
        Генерирует тепловую карту распределения брендов по экрану
        
        Args:
            detections: Список детекций
            video_width: Ширина видео
            video_height: Высота видео
        
        Returns:
            Словарь с данными распределения брендов
        """
        try:
            if not detections:
                return self._create_empty_brand_distribution()
            
            # Группируем детекции по брендам
            brand_detections = defaultdict(list)
            for detection in detections:
                brand_name = detection.get('brand_name', 'Unknown')
                brand_detections[brand_name].append(detection)
            
            # Создаем данные для каждого бренда
            brand_data = {}
            for brand_name, brand_detections_list in brand_detections.items():
                # Генерируем тепловую карту для этого бренда
                heatmap_data = self.generate_heatmap_data(
                    brand_detections_list, video_width, video_height, grid_size=30
                )
                
                brand_data[brand_name] = {
                    'detection_count': len(brand_detections_list),
                    'heatmap_data': heatmap_data,
                    'average_confidence': np.mean([d.get('score', 0) for d in brand_detections_list]),
                    'positions': [d.get('bbox', []) for d in brand_detections_list]
                }
            
            return {
                'brand_data': brand_data,
                'total_brands': len(brand_data),
                'total_detections': len(detections),
                'video_dimensions': {
                    'width': video_width,
                    'height': video_height
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating brand distribution heatmap: {e}")
            return self._create_empty_brand_distribution()
    
    def _create_empty_brand_distribution(self) -> Dict:
        """
        Создает пустые данные распределения брендов
        """
        return {
            'brand_data': {},
            'total_brands': 0,
            'total_detections': 0,
            'video_dimensions': {
                'width': 0,
                'height': 0
            }
        }

# Глобальный экземпляр
heatmap_generator = HeatmapGenerator()
