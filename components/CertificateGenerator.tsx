import React, { useRef, useState } from 'react';
import { Certificate, CertificateDesign } from '../types';
import { Download, Printer, Share2, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import Tooltip from './Tooltip';

interface CertificateGeneratorProps {
  certificate: Certificate;
  onClose: () => void;
  // If provided, we are in preview mode and should render these instead of what's on the certificate object
  previewDesign?: CertificateDesign; 
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ certificate, onClose, previewDesign }) => {
  const certRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Merge defaults
  const design = previewDesign || certificate.design || {
      templateId: 'classic',
      primaryColor: '#1e1b4b', // Royal 900
      secondaryColor: '#d97706', // Gold 600
      signatureName: 'Director'
  };

  const title = design.titleOverride || "Certificate";
  const subTitle = "of Completion";
  const message = design.messageOverride || "This certifies that";
  const issuer = certificate.issuerName;

  const verificationUrl = `${window.location.origin}?verify_cert=${certificate.uniqueCode}`;

  const copyVerificationLink = () => {
      navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- TEMPLATE RENDERERS ---

  const renderClassic = () => (
      <div className="w-full h-full p-10 box-border relative bg-white">
          {/* Classic Border */}
          <div className="w-full h-full border-[10px] border-double box-border relative p-10 flex flex-col justify-between" style={{ borderColor: design.primaryColor }}>
              <div className="absolute top-2 left-2 right-2 bottom-2 border-[2px] pointer-events-none" style={{ borderColor: design.secondaryColor }}></div>
              
              {/* Header */}
              <div className="text-center mt-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: design.primaryColor }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8.5l2.1 6.6 6.9-2.2-4.1 5.9 1.6 7.2-6.5-3.4-6.5 3.4 1.6-7.2-4.1-5.9 6.9 2.2z"/></svg>
                  </div>
                  <h1 className="text-5xl font-serif font-bold uppercase tracking-widest mb-2" style={{ color: design.primaryColor }}>{title}</h1>
                  <h2 className="text-2xl font-serif tracking-wide uppercase" style={{ color: design.secondaryColor }}>{subTitle}</h2>
              </div>

              {/* Body */}
              <div className="text-center space-y-6">
                  <p className="text-lg text-gray-500 font-serif italic">{message}</p>
                  <h3 className="text-6xl font-script border-b-2 inline-block px-12 pb-2" style={{ fontFamily: 'Pinyon Script, cursive', color: design.primaryColor, borderColor: '#e5e7eb' }}>
                      {certificate.userName}
                  </h3>
                  <p className="text-lg text-gray-500 font-serif italic">has successfully completed the module</p>
                  <h4 className="text-3xl font-serif font-bold text-gray-900">{certificate.moduleTitle}</h4>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end px-8 mb-8">
                  <div className="text-center">
                      <div className="text-lg font-mono text-gray-400 mb-1">{new Date(certificate.issueDate).toLocaleDateString()}</div>
                      <div className="border-t border-gray-400 w-48 mt-1 pt-1 text-xs uppercase font-bold text-gray-500">Date Issued</div>
                  </div>
                  
                  {/* Seal & Verification */}
                  <div className="relative opacity-90 -mb-4 text-center">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-inner mx-auto" style={{ borderColor: design.secondaryColor, backgroundColor: design.secondaryColor }}>
                          <div className="text-white text-center text-[10px] font-bold uppercase leading-tight">Official<br/>Seal</div>
                      </div>
                      <p className="mt-2 text-[8px] font-mono text-gray-400 uppercase tracking-tighter">Verify: {certificate.uniqueCode}</p>
                  </div>

                  <div className="text-center relative">
                      {design.signatureUrl ? (
                          <img src={design.signatureUrl} alt="Sig" className="h-12 object-contain mx-auto mb-1" />
                      ) : (
                          <div className="font-script text-3xl mb-1" style={{ fontFamily: 'Pinyon Script, cursive', color: design.primaryColor }}>
                              {design.signatureName || issuer}
                          </div>
                      )}
                      <div className="border-t border-gray-400 w-48 mt-1 pt-1 text-xs uppercase font-bold text-gray-500">{issuer}</div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderModern = () => (
      <div className="w-full h-full box-border relative bg-white flex overflow-hidden">
          {/* Left Color Bar */}
          <div className="w-1/4 h-full flex flex-col justify-center items-center p-8 text-white relative" style={{ backgroundColor: design.primaryColor }}>
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <div className="relative z-10 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={design.primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8.5l2.1 6.6 6.9-2.2-4.1 5.9 1.6 7.2-6.5-3.4-6.5 3.4 1.6-7.2-4.1-5.9 6.9 2.2z"/></svg>
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-widest opacity-80">Awarded To</h2>
                  <h1 className="text-3xl font-bold mt-2 leading-tight">{certificate.userName}</h1>
                  <div className="mt-12 pt-8 border-t border-white/20">
                     <p className="text-[10px] font-mono opacity-60">VERIFICATION CODE</p>
                     <p className="font-mono text-sm tracking-widest">{certificate.uniqueCode}</p>
                  </div>
              </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 p-16 flex flex-col justify-between">
              <div className="text-right">
                  <h1 className="text-6xl font-bold uppercase tracking-tighter" style={{ color: design.primaryColor }}>{title}</h1>
                  <p className="text-xl uppercase tracking-widest font-bold mt-2" style={{ color: design.secondaryColor }}>{subTitle}</p>
              </div>

              <div className="py-12">
                  <p className="text-2xl text-gray-600 font-light mb-4">{message}</p>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">{certificate.moduleTitle}</h3>
                  <div className="h-2 w-32 rounded-full" style={{ backgroundColor: design.secondaryColor }}></div>
                  <p className="mt-6 text-gray-500">
                      Validated Credentials Portal: <br/>
                      <span className="font-mono text-xs text-royal-500">{verificationUrl}</span>
                  </p>
              </div>

              <div className="flex justify-between items-end">
                  <div>
                      <p className="text-sm font-bold text-gray-400 uppercase mb-1">Date</p>
                      <p className="text-xl font-bold text-gray-800">{new Date(certificate.issueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                      {design.signatureUrl ? (
                          <img src={design.signatureUrl} alt="Sig" className="h-16 object-contain mb-2 origin-bottom-left" />
                      ) : (
                          <div className="font-script text-4xl mb-2" style={{ fontFamily: 'Pinyon Script, cursive', color: design.primaryColor }}>
                              {design.signatureName || issuer}
                          </div>
                      )}
                      <div className="h-px bg-gray-300 w-64 mb-1"></div>
                      <p className="text-sm font-bold text-gray-400 uppercase text-right">{issuer}</p>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderMinimal = () => (
      <div className="w-full h-full p-8 box-border bg-gray-50 flex items-center justify-center">
          <div className="w-full h-full bg-white border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center text-center relative">
              {/* Corner Accents */}
              <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4" style={{ borderColor: design.primaryColor }}></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4" style={{ borderColor: design.primaryColor }}></div>

              <div className="mb-12">
                  <h1 className="text-4xl font-light uppercase tracking-[0.2em] text-gray-900 mb-2">{title}</h1>
                  <div className="w-24 h-1 mx-auto" style={{ backgroundColor: design.secondaryColor }}></div>
              </div>

              <p className="text-gray-500 text-lg mb-6">{message}</p>
              
              <h2 className="text-5xl font-bold text-gray-900 mb-8">{certificate.userName}</h2>
              
              <p className="text-gray-500 text-lg mb-2">For the completion of</p>
              <h3 className="text-2xl font-bold text-gray-800 mb-12">{certificate.moduleTitle}</h3>

              <div className="flex gap-16 w-full max-w-2xl justify-center">
                  <div className="flex-1 border-t border-gray-300 pt-4">
                      <p className="font-bold text-gray-900">{new Date(certificate.issueDate).toLocaleDateString()}</p>
                      <p className="text-xs uppercase text-gray-400 mt-1">Date</p>
                  </div>
                  <div className="flex-1 border-t border-gray-300 pt-4">
                      {design.signatureUrl ? (
                          <img src={design.signatureUrl} alt="Sig" className="h-10 object-contain mx-auto -mt-10 mb-2" />
                      ) : (
                          <p className="font-bold text-gray-900 font-script text-xl -mt-2 mb-2" style={{fontFamily: 'Pinyon Script'}}>
                              {design.signatureName || issuer}
                          </p>
                      )}
                      <p className="text-xs uppercase text-gray-400 mt-1">Authorized Signature</p>
                  </div>
              </div>
              
              <div className="absolute bottom-8 left-0 w-full text-center">
                  <p className="text-[10px] text-gray-300 font-mono tracking-widest">VERIFICATION ID: {certificate.uniqueCode}</p>
              </div>
          </div>
      </div>
  );

  const getTemplate = () => {
      switch(design.templateId) {
          case 'modern': return renderModern();
          case 'minimal': return renderMinimal();
          case 'classic': 
          default: return renderClassic();
      }
  };

  const handlePrint = () => {
    const printContent = certRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=1150,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${certificate.userName}</title>
            <style>
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; }
              .certificate-container { width: 1123px; height: 794px; overflow: hidden; }
              ${styles} 
            </style>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Pinyon+Script&family=Inter:wght@300;400;700&display=swap" rel="stylesheet">
          </head>
          <body>
            <div class="certificate-container">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Wait for fonts and tailwind CDN
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  const handleDownload = async () => {
      if (!certRef.current) return;
      setIsDownloading(true);
      try {
          // Trigger high-fidelity digital synthesis to PNG
          const dataUrl = await toPng(certRef.current, { 
              cacheBust: true,
              width: 1123,
              height: 794,
              pixelRatio: 2 // High resolution for professional output
          });
          
          const link = document.createElement('a');
          link.download = `BBL_Certificate_${certificate.uniqueCode}.png`;
          link.href = dataUrl;
          link.click();
      } catch (err) {
          console.error("Direct download failed, falling back to print protocol.", err);
          handlePrint();
      } finally {
          setIsDownloading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full overflow-hidden flex flex-col h-[95vh] animate-in zoom-in-95">
        
        {/* Toolbar */}
        <div className="bg-royal-900 text-white p-4 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
           <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 text-royal-200">
                  <ArrowLeft size={20} /> <span className="hidden md:inline font-bold">Back</span>
              </button>
              <h3 className="font-bold text-lg">
                  {previewDesign ? "Certificate Design Preview" : "Certificate Viewer"}
              </h3>
           </div>

           <div className="flex flex-wrap gap-2 justify-center">
              <Tooltip content="Share Protocol: Copy the secure cryptographic verification link to your clipboard for external validation.">
                <button 
                    onClick={copyVerificationLink}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-bold ${copied ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                    {copied ? <Check size={18} /> : <Share2 size={18} />} 
                    {copied ? 'Link Copied!' : 'Verification Link'}
                </button>
              </Tooltip>

              <Tooltip content="Hardcopy Protocol: Initiate the system print dialogue to output this credential to physical media or PDF.">
                <button onClick={handlePrint} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors">
                    <Printer size={18} /> Print
                </button>
              </Tooltip>

              <Tooltip content="Archival Protocol: High-fidelity digital synthesis. Downloads the certificate as a professional-grade image file directly to your device storage.">
                <button 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg disabled:opacity-50 active:scale-95"
                >
                    {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
                    {isDownloading ? 'Generating...' : 'Download Image'}
                </button>
              </Tooltip>
           </div>
        </div>

        {/* Certificate Canvas */}
        <div className="flex-1 bg-gray-200 overflow-auto p-4 md:p-8 flex items-center justify-center">
           <div 
             ref={certRef} 
             className="certificate-wrapper shadow-2xl transform transition-transform origin-center bg-white relative"
             // A4 Landscape Dimensions
             style={{ width: '1123px', height: '794px', minWidth: '1123px', minHeight: '794px' }}
           >
              {/* Inject critical typography styles for capture engine */}
              <style dangerouslySetInnerHTML={{ __html: styles }} />
              {getTemplate()}
           </div>
        </div>
      </div>
    </div>
  );
};

// Global styles for print context
const styles = `
  .font-script { font-family: 'Pinyon Script', cursive; }
  .font-serif { font-family: 'Cinzel', serif; }
  .font-sans { font-family: 'Inter', sans-serif; }
`;

export default CertificateGenerator;