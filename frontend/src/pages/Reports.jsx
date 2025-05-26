import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Calendar,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteReport, generateReports, getReports, getUserSavedProperties } from '../services/api';
  
  const Reports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [savedProperties, setSavedProperties] = useState([]);
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [reportType, setReportType] = useState('property_overview');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showGenerator, setShowGenerator] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
  
    const reportTypes = [
      { value: 'property_overview', label: 'Property Overview', description: 'Comprehensive property analysis' },
      { value: 'market_analysis', label: 'Market Analysis', description: 'Market trends and comparables' },
      { value: 'investment_summary', label: 'Investment Summary', description: 'Investment potential and returns' },
      { value: 'risk_assessment', label: 'Risk Assessment', description: 'Risk factors and mitigation' }
    ];
  
    useEffect(() => {
      fetchData();
    }, []);
  
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const headers = { 'Authorization': `Bearer ${token}` };
  
        const [reportsResponse, propertiesResponse] = await Promise.all([
          getReports(),
          getUserSavedProperties()
        ]);
  
        const reportsData = await reportsResponse.json();
        const propertiesData = await propertiesResponse.json();
  
        if (reportsData.success) {
          setReports(reportsData.data);
        }
  
        if (propertiesData.success) {
          setSavedProperties(propertiesData.data);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
  
    const handleGenerateReports = async () => {
      if (selectedProperties.length === 0) {
        setError('Please select at least one property');
        return;
      }
  
      try {
        setGenerating(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        const response = await generateReports(propertyIds, reportType);
  
        const data = await response.json();
  
        if (data.success) {
          setReports(prev => [...data.data, ...prev.filter(r => !data.data.find(nr => nr._id === r._id))]);
          setSelectedProperties([]);
          setShowGenerator(false);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to generate reports');
        console.error('Error generating reports:', err);
      } finally {
        setGenerating(false);
      }
    };
  
    const handleDeleteReport = async (reportId) => {
      if (!window.confirm('Are you sure you want to delete this report?')) return;
  
      try {
        const token = localStorage.getItem('authToken');
        const response = await deleteReport(reportId);
  
        if (response.ok) {
          setReports(prev => prev.filter(r => r._id !== reportId));
        }
      } catch (err) {
        console.error('Error deleting report:', err);
      }
    };

    const formatInlineMarkdown = (text) => {
        return text
          // Bold text: **text** -> <strong>text</strong>
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
          // Italic text: *text* -> <em>text</em>
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
          // Code: `text` -> <code>text</code>
          .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
          // Links: [text](url) -> <a>text</a>
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>');
      };
  
    const handleDownloadPDF = async (reportId) => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/reports/${reportId}/pdf`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `report-${reportId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } catch (err) {
        console.error('Error downloading PDF:', err);
      }
    };
  
    const togglePropertySelection = (propertyId) => {
      setSelectedProperties(prev => 
        prev.includes(propertyId) 
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId]
      );
    };
  
    const getPropertyAddress = (property) => {
      return property.address || 
             property.propertyData?.fullAddress || 
             property.propertyData?.address?.oneLine || 
             'Unknown Address';
    };
  
    const filteredReports = reports.filter(report =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    const filteredProperties = savedProperties.filter(property =>
      getPropertyAddress(property).toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    // Get properties that don't have reports for the selected report type
    const availableProperties = filteredProperties.filter(property => 
      !reports.some(report => 
        report.savedProperty._id === property._id && 
        report.reportType === reportType
      )
    );
  
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Reports</h2>
            <p className="text-gray-600">Preparing your reports...</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    Smart Reports
                  </h1>
                  <p className="text-gray-600">AI-powered property analysis reports</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowGenerator(!showGenerator)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Generate Reports
              </button>
            </div>
          </div>
        </header>
  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
  
          {/* Report Generator */}
          {showGenerator && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  AI Report Generator
                </h3>
                <p className="text-sm text-gray-500 mt-1">Select properties and report type to generate intelligent analysis</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Report Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportTypes.map(type => (
                      <div
                        key={type.value}
                        onClick={() => setReportType(type.value)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          reportType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-gray-900">{type.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
  
                {/* Property Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Properties ({selectedProperties.length} selected)
                  </label>
                  
                  {availableProperties.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">All properties already have reports of this type</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {availableProperties.map(property => (
                        <div
                        key={property._id}
                        onClick={() => togglePropertySelection(property._id)}
                        className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 flex items-center ${
                          selectedProperties.includes(property._id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProperties.includes(property._id)}
                          onChange={() => {}}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{getPropertyAddress(property)}</p>
                          <p className="text-sm text-gray-500">
                            {property.propertyData?.summary?.propclass || 'Property'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGenerator(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReports}
                  disabled={selectedProperties.length === 0 || generating}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Reports ({selectedProperties.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Generated Reports ({filteredReports.length})</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredReports.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
                <p className="text-gray-500 mb-6">Generate your first AI-powered property report</p>
                <button
                  onClick={() => setShowGenerator(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Get Started
                </button>
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-medium text-gray-900 mr-3">{report.title}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {report.reportType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{report.summary}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 mr-1" />
                          AI Generated
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                    <button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedReport(report);
  }}
  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
  title="View Report"
>
  <Eye className="h-5 w-5" />
</button>
                      <button
                        onClick={() => handleDownloadPDF(report._id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{selectedReport.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Generated on {new Date(selectedReport.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={() => setSelectedReport(null)}
          className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6 overflow-auto max-h-[calc(90vh-120px)] bg-white">
        <div className="prose max-w-none">
          {selectedReport.content.split('\n').map((line, index) => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('# ')) {
              return (
                <h1 key={index} className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">
                  {trimmedLine.substring(2)}
                </h1>
              );
            } else if (trimmedLine.startsWith('## ')) {
              return (
                <h2 key={index} className="text-2xl font-semibold mb-4 mt-8 text-gray-800">
                  {trimmedLine.substring(3)}
                </h2>
              );
            } else if (trimmedLine.startsWith('### ')) {
              return (
                <h3 key={index} className="text-xl font-medium mb-3 mt-6 text-gray-800">
                  {trimmedLine.substring(4)}
                </h3>
              );
            } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
              // Handle bullet points
              const bulletText = trimmedLine.substring(2);
              const formattedText = formatInlineMarkdown(bulletText);
              return (
                <div key={index} className="flex items-start mb-2">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: formattedText }} />
                </div>
              );
            } else if (trimmedLine && !trimmedLine.startsWith('#')) {
              // Handle regular paragraphs with inline formatting
              const formattedText = formatInlineMarkdown(trimmedLine);
              return (
                <p key={index} className="mb-4 text-gray-700 leading-relaxed text-base" 
                   dangerouslySetInnerHTML={{ __html: formattedText }} />
              );
            } else if (trimmedLine === '') {
              return <div key={index} className="mb-3"></div>;
            }
            return null;
          }).filter(Boolean)}
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
        <button
          onClick={() => handleDownloadPDF(selectedReport._id)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </button>
        <button
          onClick={() => setSelectedReport(null)}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Reports;