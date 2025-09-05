// Simple PDF Generator - использует встроенные возможности браузера
// Не требует внешних библиотек

export interface SimpleReportData {
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

export class SimplePDFGenerator {
  private static instance: SimplePDFGenerator;
  
  public static getInstance(): SimplePDFGenerator {
    if (!SimplePDFGenerator.instance) {
      SimplePDFGenerator.instance = new SimplePDFGenerator();
    }
    return SimplePDFGenerator.instance;
  }

  // Генерирует HTML отчет, который можно сохранить как PDF
  public generateHTMLReport(reportData: SimpleReportData): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logo Detection Analysis Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }
        .header .subtitle {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 16px;
        }
        .header .date {
            color: #999;
            font-size: 12px;
            margin-top: 5px;
        }
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
        }
        .summary h2 {
            color: #333;
            margin-top: 0;
            font-size: 20px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .metric {
            background: white;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #007bff;
        }
        .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .file-section {
            margin-bottom: 40px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
        }
        .file-header {
            background: #007bff;
            color: white;
            padding: 15px 20px;
            font-size: 18px;
            font-weight: bold;
        }
        .file-content {
            padding: 20px;
        }
        .file-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
        }
        .info-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        .info-value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-top: 2px;
        }
        .brands-list {
            background: #e8f4fd;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .brands-list h4 {
            margin: 0 0 10px 0;
            color: #007bff;
        }
        .brand-tag {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin: 2px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .table th,
        .table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .table tr:hover {
            background: #f8f9fa;
        }
        .score-high { color: #28a745; font-weight: bold; }
        .score-medium { color: #ffc107; font-weight: bold; }
        .score-low { color: #dc3545; font-weight: bold; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { background: white; }
            .report-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>Logo Detection Analysis Report</h1>
            <p class="subtitle">Comprehensive Analysis Report</p>
            <p class="date">Generated: ${reportData.generatedAt.toLocaleString()}</p>
        </div>

        <div class="summary">
            <h2>Executive Summary</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-label">Total Files</div>
                    <div class="metric-value">${reportData.totalFiles}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Total Detections</div>
                    <div class="metric-value">${reportData.totalDetections}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Unique Brands</div>
                    <div class="metric-value">${reportData.totalBrands}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Avg Detections/File</div>
                    <div class="metric-value">${(reportData.totalDetections / reportData.totalFiles).toFixed(1)}</div>
                </div>
            </div>
        </div>

        ${reportData.files.map(file => this.generateFileSection(file)).join('')}

        <div class="footer">
            <p>Report generated by LogoVision Pro • ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  // Генерирует секцию для каждого файла
  private generateFileSection(file: any): string {
    const allBrands = new Set<string>();
    file.brands.forEach((brand: string) => allBrands.add(brand));

    return `
        <div class="file-section">
            <div class="file-header">
                File ${file.fileNumber}: ${file.fileName}
            </div>
            <div class="file-content">
                <div class="file-info">
                    <div class="info-item">
                        <div class="info-label">File ID</div>
                        <div class="info-value">${file.fileId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Type</div>
                        <div class="info-value">${file.fileType.toUpperCase()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Detections</div>
                        <div class="info-value">${file.detections}</div>
                    </div>
                    ${file.duration ? `
                    <div class="info-item">
                        <div class="info-label">Duration</div>
                        <div class="info-value">${file.duration.toFixed(2)}s</div>
                    </div>
                    ` : ''}
                </div>

                ${file.brands.length > 0 ? `
                <div class="brands-list">
                    <h4>Detected Brands</h4>
                    ${file.brands.map((brand: string) => `<span class="brand-tag">${brand}</span>`).join('')}
                </div>
                ` : ''}

                ${file.predictionsData && file.predictionsData.length > 0 ? this.generateBrandStatisticsTable(file.predictionsData) : ''}
                
                ${file.fileType === 'video' && file.temporalData && file.temporalData.length > 0 ? this.generateTemporalTable(file.temporalData) : ''}
            </div>
        </div>
    `;
  }

  // Генерирует таблицу статистики по брендам
  private generateBrandStatisticsTable(predictionsData: any[]): string {
    return `
        <h4>Brand Performance Analysis</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>Brand</th>
                    <th>Detections</th>
                    <th>Avg Score</th>
                    <th>Max Score</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>
                ${predictionsData.map(prediction => {
                  const brandName = prediction.brands?.name || 'Unknown';
                  const detections = prediction.total_detections || 0;
                  const avgScore = prediction.avg_score ? (prediction.avg_score * 100).toFixed(1) + '%' : 'N/A';
                  const maxScore = prediction.max_score ? (prediction.max_score * 100).toFixed(1) + '%' : 'N/A';
                  const duration = prediction.duration_seconds ? prediction.duration_seconds.toFixed(1) + 's' : 'N/A';
                  
                  const avgScoreClass = this.getScoreClass(prediction.avg_score);
                  const maxScoreClass = this.getScoreClass(prediction.max_score);

                  return `
                    <tr>
                        <td>${brandName}</td>
                        <td>${detections}</td>
                        <td class="${avgScoreClass}">${avgScore}</td>
                        <td class="${maxScoreClass}">${maxScore}</td>
                        <td>${duration}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    `;
  }

  // Генерирует таблицу временной аналитики
  private generateTemporalTable(temporalData: any[]): string {
    return `
        <h4>Temporal Analytics</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>Time Range</th>
                    <th>Brand</th>
                    <th>Detections</th>
                    <th>Avg Score</th>
                </tr>
            </thead>
            <tbody>
                ${temporalData.slice(0, 20).map(item => {
                  const timeRange = `${item.t_start?.toFixed(1) || '0'}s - ${item.t_end?.toFixed(1) || '0'}s`;
                  const brand = item.brands?.name || 'Unknown';
                  const detections = item.total_detections || 0;
                  const avgScore = item.avg_score ? (item.avg_score * 100).toFixed(1) + '%' : 'N/A';
                  const scoreClass = this.getScoreClass(item.avg_score);

                  return `
                    <tr>
                        <td>${timeRange}</td>
                        <td>${brand}</td>
                        <td>${detections}</td>
                        <td class="${scoreClass}">${avgScore}</td>
                    </tr>
                  `;
                }).join('')}
                ${temporalData.length > 20 ? `
                <tr>
                    <td colspan="4" style="text-align: center; color: #666;">
                        ... and ${temporalData.length - 20} more entries
                    </td>
                </tr>
                ` : ''}
            </tbody>
        </table>
    `;
  }

  // Определяет CSS класс для оценки
  private getScoreClass(score: number): string {
    if (!score) return '';
    if (score >= 0.8) return 'score-high';
    if (score >= 0.6) return 'score-medium';
    return 'score-low';
  }

  // Скачивает HTML отчет как файл
  public downloadHTMLReport(reportData: SimpleReportData): void {
    const html = this.generateHTMLReport(reportData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `logo-detection-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Открывает отчет в новом окне для печати/сохранения как PDF
  public openReportForPrint(reportData: SimpleReportData): void {
    const html = this.generateHTMLReport(reportData);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
      
      // Автоматически открываем диалог печати
      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
  }

  // Создает данные для отчета из результатов обработки
  public static createReportData(
    processingResults: any[],
    sessionId?: string
  ): SimpleReportData {
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
      fileType: result.file_type || 'video',
      detections: result.detections?.length || result.detections_count || 0,
      brands: result.brands_detected || [],
      duration: result.duration,
      detectionsData: result.detections,
      predictionsData: result.predictions,
      temporalData: result.temporal_analytics
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
}
