// PDF Report Generator
// Генерирует PDF отчет со всей информацией с экрана

export interface PDFReportData {
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
    duration?: number; // для видео
    detectionsData?: any[];
    predictionsData?: any[];
    temporalData?: any[];
  }>;
  generatedAt: Date;
  sessionId?: string;
}

export class PDFReportGenerator {
  private static instance: PDFReportGenerator;
  
  public static getInstance(): PDFReportGenerator {
    if (!PDFReportGenerator.instance) {
      PDFReportGenerator.instance = new PDFReportGenerator();
    }
    return PDFReportGenerator.instance;
  }

  // Основная функция генерации PDF
  public async generateReport(reportData: PDFReportData): Promise<void> {
    try {
      // Динамически импортируем jsPDF только когда нужно
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Заголовок отчета
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Logo Detection Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Информация о генерации
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${reportData.generatedAt.toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Общая статистика
      this.addSummarySection(doc, reportData, yPosition);
      yPosition = this.getNextYPosition(yPosition, 60);

      // Детальная информация по каждому файлу
      for (let i = 0; i < reportData.files.length; i++) {
        const file = reportData.files[i];
        
        // Проверяем, нужна ли новая страница
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        yPosition = this.addFileSection(doc, file, yPosition, pageWidth);
        
        // Добавляем страницу между файлами если нужно
        if (i < reportData.files.length - 1 && yPosition > pageHeight - 150) {
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

  // Добавляет секцию с общей статистикой
  private addSummarySection(doc: any, reportData: PDFReportData, yPosition: number): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
      `Total Files Processed: ${reportData.totalFiles}`,
      `Total Detections: ${reportData.totalDetections}`,
      `Total Brands Detected: ${reportData.totalBrands}`,
      `Report Generated: ${reportData.generatedAt.toLocaleString()}`
    ];

    summaryData.forEach(line => {
      doc.text(line, 25, yPosition);
      yPosition += 8;
    });

    return yPosition;
  }

  // Добавляет секцию для каждого файла
  private addFileSection(doc: any, file: any, yPosition: number, pageWidth: number): number {
    // Заголовок файла
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`File ${file.fileNumber}: ${file.fileName}`, 20, yPosition);
    yPosition += 10;

    // Информация о файле
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
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

    yPosition += 5;

    // Детальная статистика по брендам
    if (file.predictionsData && file.predictionsData.length > 0) {
      yPosition = this.addBrandStatistics(doc, file.predictionsData, yPosition);
    }

    // Временная аналитика (только для видео)
    if (file.fileType === 'video' && file.temporalData && file.temporalData.length > 0) {
      yPosition = this.addTemporalAnalytics(doc, file.temporalData, yPosition);
    }

    return yPosition + 10;
  }

  // Добавляет статистику по брендам
  private addBrandStatistics(doc: any, predictionsData: any[], yPosition: number): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Brand Statistics:', 25, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Заголовки таблицы
    doc.text('Brand', 30, yPosition);
    doc.text('Detections', 80, yPosition);
    doc.text('Avg Score', 120, yPosition);
    doc.text('Max Score', 160, yPosition);
    yPosition += 6;

    // Данные таблицы
    predictionsData.forEach(prediction => {
      if (yPosition > 280) { // Проверяем, не выходим ли за пределы страницы
        return yPosition;
      }

      const brandName = prediction.brands?.name || 'Unknown';
      const detections = prediction.total_detections || 0;
      const avgScore = prediction.avg_score ? (prediction.avg_score * 100).toFixed(1) + '%' : 'N/A';
      const maxScore = prediction.max_score ? (prediction.max_score * 100).toFixed(1) + '%' : 'N/A';

      doc.text(brandName, 30, yPosition);
      doc.text(detections.toString(), 80, yPosition);
      doc.text(avgScore, 120, yPosition);
      doc.text(maxScore, 160, yPosition);
      yPosition += 5;
    });

    return yPosition + 5;
  }

  // Добавляет временную аналитику
  private addTemporalAnalytics(doc: any, temporalData: any[], yPosition: number): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Temporal Analytics:', 25, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Простая таблица с временными данными
    doc.text('Time Range', 30, yPosition);
    doc.text('Brand', 80, yPosition);
    doc.text('Detections', 130, yPosition);
    yPosition += 6;

    temporalData.slice(0, 10).forEach((item, index) => { // Ограничиваем до 10 записей
      if (yPosition > 280) {
        return yPosition;
      }

      const timeRange = `${item.t_start?.toFixed(1) || '0'}s - ${item.t_end?.toFixed(1) || '0'}s`;
      const brand = item.brands?.name || 'Unknown';
      const detections = item.total_detections || 0;

      doc.text(timeRange, 30, yPosition);
      doc.text(brand, 80, yPosition);
      doc.text(detections.toString(), 130, yPosition);
      yPosition += 5;
    });

    if (temporalData.length > 10) {
      doc.text(`... and ${temporalData.length - 10} more entries`, 30, yPosition);
      yPosition += 5;
    }

    return yPosition + 5;
  }

  // Вычисляет следующую позицию Y
  private getNextYPosition(currentY: number, additionalSpace: number): number {
    return currentY + additionalSpace;
  }

  // Создает данные для отчета из результатов обработки
  public static createReportData(
    processingResults: any[],
    sessionId?: string
  ): PDFReportData {
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

    const files = processingResults.map((result, index) => ({
      fileNumber: index + 1,
      fileId: result.file_id || `unknown-${index}`,
      fileName: result.filename || `File ${index + 1}`,
      fileType: result.file_type || 'video', // Предполагаем видео по умолчанию
      detections: result.detections?.length || result.detections_count || 0,
      brands: result.brands_detected || [],
      duration: result.duration,
      detectionsData: result.detections,
      predictionsData: result.predictions,
      temporalData: result.temporal_analytics,
      // Добавляем дополнительную информацию
      fileSize: result.file_size,
      processingTime: result.processing_time,
      model: result.model || 'yolov8',
      confidence: result.confidence_threshold
    }));

    return {
      totalFiles: processingResults.length,
      totalDetections,
      totalBrands: allBrands.size,
      files,
      generatedAt: new Date(),
      sessionId
    };
  }

  // Расширенная функция генерации PDF с полными данными
  public async generateComprehensiveReport(reportData: PDFReportData): Promise<void> {
    try {
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Заголовок отчета
      this.addReportHeader(doc, pageWidth, yPosition);
      yPosition = 40;

      // Общая статистика
      yPosition = this.addComprehensiveSummary(doc, reportData, yPosition, pageWidth);
      
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

        yPosition = this.addComprehensiveFileSection(doc, file, yPosition, pageWidth, pageHeight);
        
        if (i < reportData.files.length - 1) {
          doc.addPage();
          yPosition = 20;
        }
      }

      // Сохраняем PDF
      const fileName = `logo-detection-comprehensive-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating comprehensive PDF report:', error);
      throw new Error('Failed to generate comprehensive PDF report. Please try again.');
    }
  }

  // Добавляет заголовок отчета
  private addReportHeader(doc: any, pageWidth: number, yPosition: number): void {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Logo Detection Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
  }

  // Добавляет расширенную сводку
  private addComprehensiveSummary(doc: any, reportData: PDFReportData, yPosition: number, pageWidth: number): number {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    // Создаем таблицу с ключевыми метриками
    const summaryMetrics = [
      ['Total Files Processed', reportData.totalFiles.toString()],
      ['Total Detections Found', reportData.totalDetections.toString()],
      ['Unique Brands Detected', reportData.totalBrands.toString()],
      ['Average Detections per File', (reportData.totalDetections / reportData.totalFiles).toFixed(1)],
      ['Report Generation Date', reportData.generatedAt.toLocaleDateString()],
      ['Report Generation Time', reportData.generatedAt.toLocaleTimeString()]
    ];

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    summaryMetrics.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 120, yPosition);
      yPosition += 8;
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
        doc.text('Detected Brands:', 25, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const brandsList = Array.from(allBrands).join(', ');
        const lines = doc.splitTextToSize(brandsList, pageWidth - 50);
        doc.text(lines, 30, yPosition);
        yPosition += lines.length * 5 + 5;
      }
    }

    return yPosition;
  }

  // Добавляет расширенную секцию для файла
  private addComprehensiveFileSection(doc: any, file: any, yPosition: number, pageWidth: number, pageHeight: number): number {
    // Заголовок файла
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`File ${file.fileNumber}: ${file.fileName}`, 20, yPosition);
    yPosition += 12;

    // Основная информация о файле
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const fileInfo = [
      `File ID: ${file.fileId}`,
      `Type: ${file.fileType.toUpperCase()}`,
      `Detections: ${file.detections}`,
      `Brands: ${file.brands.join(', ') || 'None'}`
    ];

    if (file.duration) {
      fileInfo.splice(3, 0, `Duration: ${file.duration.toFixed(2)}s`);
    }

    if (file.fileSize) {
      fileInfo.push(`File Size: ${(file.fileSize / 1024 / 1024).toFixed(2)} MB`);
    }

    if (file.processingTime) {
      fileInfo.push(`Processing Time: ${file.processingTime.toFixed(2)}s`);
    }

    if (file.model) {
      fileInfo.push(`Model: ${file.model}`);
    }

    if (file.confidence) {
      fileInfo.push(`Confidence Threshold: ${(file.confidence * 100).toFixed(1)}%`);
    }

    fileInfo.forEach(line => {
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Детальная статистика по брендам
    if (file.predictionsData && file.predictionsData.length > 0) {
      yPosition = this.addDetailedBrandStatistics(doc, file.predictionsData, yPosition, pageHeight);
    }

    // Временная аналитика (только для видео)
    if (file.fileType === 'video' && file.temporalData && file.temporalData.length > 0) {
      yPosition = this.addDetailedTemporalAnalytics(doc, file.temporalData, yPosition, pageHeight);
    }

    // Детекции (если есть)
    if (file.detectionsData && file.detectionsData.length > 0) {
      yPosition = this.addDetectionsSummary(doc, file.detectionsData, yPosition, pageHeight);
    }

    return yPosition + 10;
  }

  // Добавляет детальную статистику по брендам
  private addDetailedBrandStatistics(doc: any, predictionsData: any[], yPosition: number, pageHeight: number): number {
    if (yPosition > pageHeight - 80) {
      return yPosition;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Brand Performance Analysis:', 25, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Заголовки таблицы
    doc.setFont('helvetica', 'bold');
    doc.text('Brand', 30, yPosition);
    doc.text('Detections', 80, yPosition);
    doc.text('Avg Score', 120, yPosition);
    doc.text('Max Score', 160, yPosition);
    doc.text('Duration', 200, yPosition);
    yPosition += 6;

    // Данные таблицы
    doc.setFont('helvetica', 'normal');
    predictionsData.forEach(prediction => {
      if (yPosition > pageHeight - 20) {
        return yPosition;
      }

      const brandName = prediction.brands?.name || 'Unknown';
      const detections = prediction.total_detections || 0;
      const avgScore = prediction.avg_score ? (prediction.avg_score * 100).toFixed(1) + '%' : 'N/A';
      const maxScore = prediction.max_score ? (prediction.max_score * 100).toFixed(1) + '%' : 'N/A';
      const duration = prediction.duration_seconds ? prediction.duration_seconds.toFixed(1) + 's' : 'N/A';

      doc.text(brandName, 30, yPosition);
      doc.text(detections.toString(), 80, yPosition);
      doc.text(avgScore, 120, yPosition);
      doc.text(maxScore, 160, yPosition);
      doc.text(duration, 200, yPosition);
      yPosition += 5;
    });

    return yPosition + 5;
  }

  // Добавляет детальную временную аналитику
  private addDetailedTemporalAnalytics(doc: any, temporalData: any[], yPosition: number, pageHeight: number): number {
    if (yPosition > pageHeight - 60) {
      return yPosition;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Temporal Analytics:', 25, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Заголовки таблицы
    doc.setFont('helvetica', 'bold');
    doc.text('Time Range', 30, yPosition);
    doc.text('Brand', 80, yPosition);
    doc.text('Detections', 130, yPosition);
    doc.text('Avg Score', 170, yPosition);
    yPosition += 6;

    // Данные таблицы (ограничиваем до 15 записей)
    doc.setFont('helvetica', 'normal');
    temporalData.slice(0, 15).forEach((item, index) => {
      if (yPosition > pageHeight - 20) {
        return yPosition;
      }

      const timeRange = `${item.t_start?.toFixed(1) || '0'}s - ${item.t_end?.toFixed(1) || '0'}s`;
      const brand = item.brands?.name || 'Unknown';
      const detections = item.total_detections || 0;
      const avgScore = item.avg_score ? (item.avg_score * 100).toFixed(1) + '%' : 'N/A';

      doc.text(timeRange, 30, yPosition);
      doc.text(brand, 80, yPosition);
      doc.text(detections.toString(), 130, yPosition);
      doc.text(avgScore, 170, yPosition);
      yPosition += 5;
    });

    if (temporalData.length > 15) {
      doc.text(`... and ${temporalData.length - 15} more entries`, 30, yPosition);
      yPosition += 5;
    }

    return yPosition + 5;
  }

  // Добавляет сводку по детекциям
  private addDetectionsSummary(doc: any, detectionsData: any[], yPosition: number, pageHeight: number): number {
    if (yPosition > pageHeight - 40) {
      return yPosition;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Detection Summary:', 25, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Группируем детекции по брендам
    const detectionsByBrand = detectionsData.reduce((acc, detection) => {
      const brandName = detection.brands?.name || detection.brand_name || 'Unknown';
      if (!acc[brandName]) {
        acc[brandName] = [];
      }
      acc[brandName].push(detection);
      return acc;
    }, {});

    Object.entries(detectionsByBrand).forEach(([brandName, detections]) => {
      if (yPosition > pageHeight - 20) {
        return yPosition;
      }

      const detectionsArray = detections as any[];
      doc.setFont('helvetica', 'bold');
      doc.text(`${brandName}:`, 30, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`${detectionsArray.length} detections`, 100, yPosition);
      yPosition += 6;
    });

    return yPosition + 5;
  }
}
