// Advanced PDF Generator - использует jsPDF для создания настоящих PDF файлов
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface AdvancedReportData {
  totalFiles: number;
  totalDetections: number;
  totalBrands: number;
  files: Array<{
    fileNumber: number;
    fileId: string;
    fileName: string;
    fileType: 'video' | 'image';
    detections: number;
    brands: string[];
    duration?: number;
    detectionsData?: any[];
    predictionsData?: any[];
    temporalData?: any[];
  }>;
  generatedAt: Date;
  sessionId?: string;
}

export class AdvancedPDFGenerator {
  private static instance: AdvancedPDFGenerator;
  
  public static getInstance(): AdvancedPDFGenerator {
    if (!AdvancedPDFGenerator.instance) {
      AdvancedPDFGenerator.instance = new AdvancedPDFGenerator();
    }
    return AdvancedPDFGenerator.instance;
  }

  // Генерирует настоящий PDF файл
  public async generatePDFReport(reportData: AdvancedReportData): Promise<void> {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Заголовок отчета
      this.addReportHeader(doc, pageWidth, yPosition);
      yPosition = 50;

      // Общая статистика
      yPosition = this.addSummarySection(doc, reportData, yPosition, pageWidth);
      
      // Добавляем новую страницу для детальной информации
      doc.addPage();
      yPosition = 20;

      // Детальная информация по каждому файлу
      for (let i = 0; i < reportData.files.length; i++) {
        const file = reportData.files[i];
        
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        yPosition = await this.addFileSectionWithImages(doc, file, yPosition, pageWidth, pageHeight);
        
        if (i < reportData.files.length - 1) {
          doc.addPage();
          yPosition = 20;
        }
      }

      // Сохраняем PDF
      const fileName = `logo-detection-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report. Please try again.');
    }
  }

  // Добавляет заголовок отчета
  private addReportHeader(doc: jsPDF, pageWidth: number, yPosition: number): void {
    // Заголовок
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255); // Синий цвет
    doc.text('Logo Detection Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    
    // Подзаголовок
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Comprehensive Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    
    // Дата генерации
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    
    // Линия под заголовком
    yPosition += 10;
    doc.setDrawColor(0, 123, 255);
    doc.setLineWidth(2);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
  }

  // Добавляет секцию с общей статистикой
  private addSummarySection(doc: jsPDF, reportData: AdvancedReportData, yPosition: number, pageWidth: number): number {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    // Создаем таблицу с ключевыми метриками
    const metrics = [
      { label: 'Total Files Processed', value: reportData.totalFiles.toString() },
      { label: 'Total Detections Found', value: reportData.totalDetections.toString() },
      { label: 'Unique Brands Detected', value: reportData.totalBrands.toString() },
      { label: 'Average Detections per File', value: (reportData.totalDetections / reportData.totalFiles).toFixed(1) }
    ];

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    metrics.forEach(metric => {
      // Фон для метрики
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPosition - 5, pageWidth - 40, 12, 'F');
      
      // Текст метрики
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(metric.label + ':', 25, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 123, 255);
      doc.text(metric.value, 150, yPosition);
      
      yPosition += 15;
    });

    yPosition += 10;

    // Добавляем информацию о брендах
    if (reportData.files.length > 0) {
      const allBrands = new Set<string>();
      reportData.files.forEach(file => {
        file.brands.forEach(brand => allBrands.add(brand));
      });

      if (allBrands.size > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Detected Brands:', 25, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const brandsList = Array.from(allBrands).join(', ');
        const lines = doc.splitTextToSize(brandsList, pageWidth - 50);
        doc.text(lines, 30, yPosition);
        yPosition += lines.length * 5 + 10;
      }
    }

    return yPosition;
  }

  // Добавляет секцию для каждого файла с изображениями
  private async addFileSectionWithImages(doc: jsPDF, file: any, yPosition: number, pageWidth: number, pageHeight: number): Promise<number> {
    // Заголовок файла с фоном
    doc.setFillColor(0, 123, 255);
    doc.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`File ${file.fileNumber}: ${file.fileName}`, 25, yPosition);
    yPosition += 20;

    // Основная информация о файле
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const fileInfo = [
      `File ID: ${file.fileId}`,
      `Type: ${file.fileType.toUpperCase()}`,
      `Detections: ${file.detections}`,
      `Brands: ${file.brands.join(', ') || 'None'}`
    ];

    if (file.duration) {
      fileInfo.splice(3, 0, `Duration: ${file.duration.toFixed(2)}s`);
    }

    fileInfo.forEach(line => {
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Добавляем скриншоты детекций (если есть)
    if (file.detectionsData && file.detectionsData.length > 0) {
      yPosition = await this.addDetectionScreenshots(doc, file.detectionsData, yPosition, pageWidth, pageHeight);
    }

    // Детальная статистика по брендам
    if (file.predictionsData && file.predictionsData.length > 0) {
      yPosition = this.addBrandStatisticsTable(doc, file.predictionsData, yPosition, pageHeight, file.duration);
      // Добавляем простой текстовый график
      yPosition = this.addTextChart(doc, file.predictionsData, yPosition, pageHeight);
      // Добавляем визуальный график
      yPosition = this.addSimpleChart(doc, file.predictionsData, yPosition, pageWidth, pageHeight);
    } else {
      // Добавляем сообщение, если нет данных
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Brand performance data not available', 25, yPosition);
      yPosition += 10;
    }

    // Временная аналитика (только для видео)
    if (file.fileType === 'video' && file.temporalData && file.temporalData.length > 0) {
      yPosition = this.addTemporalAnalyticsTable(doc, file.temporalData, yPosition, pageHeight);
    } else if (file.fileType === 'video') {
      // Добавляем сообщение для видео без временных данных
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Temporal analytics data not available', 25, yPosition);
      yPosition += 10;
    }

    return yPosition + 10;
  }

  // Добавляет скриншоты детекций
  private async addDetectionScreenshots(doc: jsPDF, detectionsData: any[], yPosition: number, pageWidth: number, pageHeight: number): Promise<number> {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Detection Screenshots:', 25, yPosition);
    yPosition += 15;

    // Ограничиваем количество изображений для PDF
    const maxImages = 4;
    const detectionsToShow = detectionsData.slice(0, maxImages);

    for (let i = 0; i < detectionsToShow.length; i++) {
      const detection = detectionsToShow[i];
      
      // Проверяем, есть ли URL изображения
      const imageUrl = detection.frame_capture_url || detection.public_url;
      
      if (imageUrl && yPosition < pageHeight - 120) {
        try {
          console.log(`🖼️ Loading detection image ${i + 1}:`, imageUrl);
          
          // Создаем временный элемент img для загрузки изображения
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Image load timeout'));
            }, 10000); // 10 секунд таймаут
            
            img.onload = () => {
              clearTimeout(timeout);
              resolve(img);
            };
            img.onerror = (error) => {
              clearTimeout(timeout);
              reject(error);
            };
            img.src = imageUrl;
          });

          // Добавляем изображение в PDF с рамкой
          const imgWidth = 100;
          const imgHeight = (img.height / img.width) * imgWidth;
          
          // Рамка вокруг изображения
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(1);
          doc.rect(25, yPosition, imgWidth, imgHeight);
          
          // Определяем формат изображения
          const imageFormat = imageUrl.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
          doc.addImage(img, imageFormat, 25, yPosition, imgWidth, imgHeight);
          
          // Добавляем информацию о детекции рядом с изображением
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          const brandName = detection.brands?.name || detection.brand_name || 'Unknown';
          const score = detection.score ? (detection.score * 100).toFixed(1) + '%' : 'N/A';
          const frame = detection.frame || 'N/A';
          
          doc.text(`Frame: ${frame}`, 130, yPosition + 10);
          doc.text(`Brand: ${brandName}`, 130, yPosition + 20);
          doc.text(`Score: ${score}`, 130, yPosition + 30);
          
          // Добавляем цветной индикатор уверенности
          const scoreColor = this.getScoreColor(detection.score);
          doc.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b);
          doc.circle(200, yPosition + 15, 3, 'F');
          
          yPosition += imgHeight + 20;
          
          console.log(`✅ Successfully added detection image ${i + 1}`);
          
        } catch (error) {
          console.warn(`❌ Failed to load detection image ${i + 1}:`, error);
          // Добавляем текстовую информацию вместо изображения
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          
          const brandName = detection.brands?.name || detection.brand_name || 'Unknown';
          const score = detection.score ? (detection.score * 100).toFixed(1) + '%' : 'N/A';
          const frame = detection.frame || 'N/A';
          
          doc.text(`Frame ${frame}: ${brandName} (${score}) - Image unavailable`, 25, yPosition);
          yPosition += 15;
        }
      }
    }

    if (detectionsData.length > maxImages) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`... and ${detectionsData.length - maxImages} more detections`, 25, yPosition);
      yPosition += 10;
    }

    return yPosition + 10;
  }

  // Добавляет секцию для каждого файла (старая версия без изображений)
  private addFileSection(doc: jsPDF, file: any, yPosition: number, pageWidth: number, pageHeight: number): number {
    // Заголовок файла с фоном
    doc.setFillColor(0, 123, 255);
    doc.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`File ${file.fileNumber}: ${file.fileName}`, 25, yPosition);
    yPosition += 20;

    // Основная информация о файле
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const fileInfo = [
      `File ID: ${file.fileId}`,
      `Type: ${file.fileType.toUpperCase()}`,
      `Detections: ${file.detections}`,
      `Brands: ${file.brands.join(', ') || 'None'}`
    ];

    if (file.duration) {
      fileInfo.splice(3, 0, `Duration: ${file.duration.toFixed(2)}s`);
    }

    fileInfo.forEach(line => {
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Детальная статистика по брендам
    if (file.predictionsData && file.predictionsData.length > 0) {
      yPosition = this.addBrandStatisticsTable(doc, file.predictionsData, yPosition, pageHeight, file.duration);
    } else {
      // Добавляем сообщение, если нет данных
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Brand performance data not available', 25, yPosition);
      yPosition += 10;
    }

    // Временная аналитика (только для видео)
    if (file.fileType === 'video' && file.temporalData && file.temporalData.length > 0) {
      yPosition = this.addTemporalAnalyticsTable(doc, file.temporalData, yPosition, pageHeight);
    } else if (file.fileType === 'video') {
      // Добавляем сообщение для видео без временных данных
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Temporal analytics data not available', 25, yPosition);
      yPosition += 10;
    }

    return yPosition + 10;
  }

  // Добавляет таблицу статистики по брендам
  private addBrandStatisticsTable(doc: jsPDF, predictionsData: any[], yPosition: number, pageHeight: number, totalDuration?: number): number {
    if (yPosition > pageHeight - 80) {
      return yPosition;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Brand Performance Analysis:', 25, yPosition);
    yPosition += 10;

    // Заголовки таблицы
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(248, 249, 250);
    doc.rect(25, yPosition - 5, 240, 8, 'F');
    
    doc.text('Brand', 30, yPosition);
    doc.text('Detections', 70, yPosition);
    doc.text('Visibility', 110, yPosition);
    doc.text('Min Score', 150, yPosition);
    doc.text('Avg Score', 230, yPosition);
    doc.text('Max Score', 230, yPosition);
    yPosition += 10;

    // Данные таблицы
    doc.setFont('helvetica', 'normal');
    predictionsData.forEach((prediction, index) => {
      if (yPosition > pageHeight - 20) {
        return yPosition;
      }

      // Чередующийся фон для строк
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(25, yPosition - 4, 240, 6, 'F');
      }

      const brandName = prediction.brands?.name || 'Unknown';
      const detections = prediction.total_detections || 0;
      
      // Calculate Brand Visibility Ratio
      const brandDuration = prediction.duration_seconds || 0;
      const visibilityRatio = totalDuration && totalDuration > 0 ? ((brandDuration / totalDuration) * 100).toFixed(1) + '%' : 'N/A';
      
      const minScore = prediction.min_score ? (prediction.min_score * 100).toFixed(1) + '%' : 'N/A';
      const avgScore = prediction.avg_score ? (prediction.avg_score * 100).toFixed(1) + '%' : 'N/A';
      const maxScore = prediction.max_score ? (prediction.max_score * 100).toFixed(1) + '%' : 'N/A';

      doc.setTextColor(0, 0, 0);
      doc.text(brandName, 30, yPosition);
      doc.text(detections.toString(), 70, yPosition);
      doc.text(visibilityRatio, 110, yPosition);
      
      // Цветовое кодирование для оценок
      const minScoreColor = this.getScoreColor(prediction.min_score);
      const avgScoreColor = this.getScoreColor(prediction.avg_score);
      const maxScoreColor = this.getScoreColor(prediction.max_score);
      
      doc.setTextColor(minScoreColor.r, minScoreColor.g, minScoreColor.b);
      doc.text(minScore, 150, yPosition);
      
      doc.setTextColor(avgScoreColor.r, avgScoreColor.g, avgScoreColor.b);
      doc.text(avgScore, 230, yPosition);
      
      doc.setTextColor(maxScoreColor.r, maxScoreColor.g, maxScoreColor.b);
      doc.text(maxScore, 230, yPosition);
      
      yPosition += 7;
    });

    return yPosition + 5;
  }

  // Добавляет таблицу временной аналитики
  private addTemporalAnalyticsTable(doc: jsPDF, temporalData: any[], yPosition: number, pageHeight: number): number {
    if (yPosition > pageHeight - 60) {
      return yPosition;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Temporal Analytics:', 25, yPosition);
    yPosition += 10;

    // Заголовки таблицы
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(248, 249, 250);
    doc.rect(25, yPosition - 5, 240, 8, 'F');
    
    doc.text('Time Range', 30, yPosition);
    doc.text('Brand', 80, yPosition);
    doc.text('Detections', 130, yPosition);
    doc.text('Avg Score', 230, yPosition);
    yPosition += 10;

    // Данные таблицы (ограничиваем до 15 записей)
    doc.setFont('helvetica', 'normal');
    temporalData.slice(0, 15).forEach((item, index) => {
      if (yPosition > pageHeight - 20) {
        return yPosition;
      }

      // Чередующийся фон для строк
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(25, yPosition - 4, 240, 6, 'F');
      }

      const timeRange = `${item.t_start?.toFixed(1) || '0'}s - ${item.t_end?.toFixed(1) || '0'}s`;
      const brand = item.brands?.name || 'Unknown';
      const detections = item.total_detections || 0;
      const avgScore = item.avg_score ? (item.avg_score * 100).toFixed(1) + '%' : 'N/A';

      doc.setTextColor(0, 0, 0);
      doc.text(timeRange, 30, yPosition);
      doc.text(brand, 80, yPosition);
      doc.text(detections.toString(), 130, yPosition);
      
      // Цветовое кодирование для оценки
      const scoreColor = this.getScoreColor(item.avg_score);
      doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
      doc.text(avgScore, 230, yPosition);
      
      yPosition += 7;
    });

    if (temporalData.length > 15) {
      doc.setTextColor(100, 100, 100);
      doc.text(`... and ${temporalData.length - 15} more entries`, 30, yPosition);
      yPosition += 5;
    }

    return yPosition + 5;
  }

  // Определяет цвет для оценки
  private getScoreColor(score: number): { r: number; g: number; b: number } {
    if (!score) return { r: 100, g: 100, b: 100 };
    if (score >= 0.8) return { r: 40, g: 167, b: 69 }; // Зеленый
    if (score >= 0.6) return { r: 255, g: 193, b: 7 }; // Желтый
    return { r: 220, g: 53, b: 69 }; // Красный
  }

  // Создает данные для отчета из результатов обработки
  public static createReportData(
    processingResults: any[],
    sessionId?: string
  ): AdvancedReportData {
    console.log('📊 Creating report data from processing results:', processingResults);
    
    const totalDetections = processingResults.reduce(
      (sum, result) => sum + (result.detections?.length || result.detections_count || 0),
      0
    );

    const allBrands = new Set<string>();
    processingResults.forEach(result => {
      if (result.brands_detected) {
        result.brands_detected.forEach((brand: string) => allBrands.add(brand));
      }
    });

    const files = processingResults.map((result, index) => {
      console.log(`📁 Processing file ${index + 1}:`, {
        file_id: result.file_id,
        predictions: result.predictions?.length || 0,
        temporal_analytics: result.temporal_analytics?.length || 0,
        detections: result.detections?.length || 0
      });
      
      return {
        fileNumber: index + 1,
        fileId: result.file_id || `unknown-${index}`,
        fileName: result.filename || `File ${index + 1}`,
        fileType: result.file_type || 'video',
        detections: result.detections?.length || result.detections_count || 0,
        brands: result.brands_detected || [],
        duration: result.duration || result.file_info?.duration_seconds,
        detectionsData: result.detections,
        predictionsData: result.predictions,
        temporalData: result.temporal_analytics
      };
    });

    const reportData = {
      totalFiles: processingResults.length,
      totalDetections,
      totalBrands: allBrands.size,
      files,
      generatedAt: new Date(),
      sessionId
    };
    
    console.log('📊 Final report data:', reportData);
    return reportData;
  }

  // Добавляет улучшенный текстовый график для визуализации данных
  private addTextChart(doc: jsPDF, predictionsData: any[], yPosition: number, pageHeight: number): number {
    if (yPosition > pageHeight - 80) {
      return yPosition;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Brand Detection Visualization:', 25, yPosition);
    yPosition += 15;

    // Находим максимальное количество детекций для масштабирования
    const maxDetections = Math.max(...predictionsData.map(p => p.total_detections || 0));
    
    if (maxDetections === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('No detection data available for visualization', 25, yPosition);
      return yPosition + 10;
    }

    // Сортируем данные по количеству детекций (по убыванию)
    const sortedData = [...predictionsData].sort((a, b) => (b.total_detections || 0) - (a.total_detections || 0));

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    sortedData.forEach((prediction, index) => {
      if (yPosition > pageHeight - 30) {
        return yPosition;
      }

      const brandName = prediction.brands?.name || 'Unknown';
      const detections = prediction.total_detections || 0;
      const avgScore = prediction.avg_score || 0;
      const percentage = (detections / maxDetections) * 100;
      
      // Создаем улучшенную полосу из символов
      const barLength = Math.round(percentage / 4); // Каждый символ = 4%
      const bar = '█'.repeat(barLength) + '░'.repeat(25 - barLength);
      
      // Обрезаем название бренда, если слишком длинное
      const displayName = brandName.length > 12 ? brandName.substring(0, 12) + '...' : brandName;
      
      // Добавляем цветовое кодирование для названия бренда
      const brandColor = this.getScoreColor(avgScore);
      doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
      doc.text(displayName.padEnd(15), 25, yPosition);
      
      // Полоса
      doc.setTextColor(0, 0, 0);
      doc.text(bar, 100, yPosition);
      
      // Количество детекций
      doc.setFont('helvetica', 'bold');
      doc.text(detections.toString(), 200, yPosition);
      
      // Средняя оценка
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`(${(avgScore * 100).toFixed(1)}%)`, 220, yPosition);
      
      yPosition += 10;
    });

    // Добавляем улучшенную легенду
    yPosition += 10;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Legend: █ = Detections (max: ' + maxDetections + ') | Color = Avg Score (Green: >80%, Yellow: 60-80%, Red: <60%)', 25, yPosition);
    yPosition += 15;

    return yPosition;
  }

  // Добавляет простой график с помощью jsPDF
  private addSimpleChart(doc: jsPDF, predictionsData: any[], yPosition: number, pageWidth: number, pageHeight: number): number {
    if (yPosition > pageHeight - 100) {
      return yPosition;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Brand Detection Chart:', 25, yPosition);
    yPosition += 20;

    // Находим максимальное количество детекций для масштабирования
    const maxDetections = Math.max(...predictionsData.map(p => p.total_detections || 0));
    
    if (maxDetections === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('No detection data available for chart', 25, yPosition);
      return yPosition + 10;
    }

    // Сортируем данные по количеству детекций (по убыванию)
    const sortedData = [...predictionsData].sort((a, b) => (b.total_detections || 0) - (a.total_detections || 0));

    const chartWidth = 150;
    const chartHeight = 80;
    const chartX = 25;
    const chartY = yPosition;

    // Рисуем рамку графика
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.rect(chartX, chartY, chartWidth, chartHeight);

    // Рисуем оси
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    // Горизонтальная ось
    doc.line(chartX + 20, chartY + chartHeight - 10, chartX + chartWidth - 10, chartY + chartHeight - 10);
    // Вертикальная ось
    doc.line(chartX + 20, chartY + 10, chartX + 20, chartY + chartHeight - 10);

    // Рисуем столбцы
    const barWidth = (chartWidth - 30) / sortedData.length - 2;
    const maxBarHeight = chartHeight - 20;

    sortedData.forEach((prediction, index) => {
      const detections = prediction.total_detections || 0;
      const barHeight = (detections / maxDetections) * maxBarHeight;
      const barX = chartX + 25 + index * (barWidth + 2);
      const barY = chartY + chartHeight - 10 - barHeight;

      // Цвет столбца на основе средней оценки
      const avgScore = prediction.avg_score || 0;
      const barColor = this.getScoreColor(avgScore);
      doc.setFillColor(barColor.r, barColor.g, barColor.b);
      doc.rect(barX, barY, barWidth, barHeight, 'F');

      // Подпись под столбцом
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const brandName = prediction.brands?.name || 'Unknown';
      const shortName = brandName.length > 6 ? brandName.substring(0, 6) : brandName;
      doc.text(shortName, barX + barWidth/2 - 3, chartY + chartHeight - 5, { angle: 45 });
    });

    // Добавляем значения на столбцы
    sortedData.forEach((prediction, index) => {
      const detections = prediction.total_detections || 0;
      const barHeight = (detections / maxDetections) * maxBarHeight;
      const barX = chartX + 25 + index * (barWidth + 2);
      const barY = chartY + chartHeight - 10 - barHeight;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(detections.toString(), barX + barWidth/2 - 2, barY - 2);
    });

    // Добавляем заголовок оси Y
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Detections', chartX - 5, chartY + chartHeight/2, { angle: 90 });

    yPosition += chartHeight + 20;

    return yPosition;
  }
}
