import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Sparkles, Share2, Copy, Moon, Sun, 
  Upload, Image as ImageIcon, LayoutTemplate, Palette, Type as TypeIcon,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo: string | null;
}

interface AIDesign {
  palette: {
    bg: string;
    text: string;
    accent: string;
  };
  font: string;
  tagline: string;
  layout: 'minimal' | 'modern' | 'premium';
}

const TEMPLATES: Record<string, AIDesign> = {
  'dark-minimal': {
    palette: { bg: '#171717', text: '#ffffff', accent: '#3b82f6' },
    font: 'Inter',
    tagline: '',
    layout: 'minimal'
  },
  'light-professional': {
    palette: { bg: '#ffffff', text: '#1e293b', accent: '#0f172a' },
    font: 'Roboto',
    tagline: '',
    layout: 'modern'
  },
  'gradient-creative': {
    palette: { bg: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', text: '#ffffff', accent: '#facc15' },
    font: 'Poppins',
    tagline: '',
    layout: 'premium'
  }
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<CardData>({
    name: 'Alex Morgan',
    title: 'Product Designer',
    company: 'Nexus Tech',
    phone: '+1 (555) 123-4567',
    email: 'alex@nexustech.io',
    website: 'www.nexustech.io',
    address: 'San Francisco, CA',
    logo: null
  });

  const [qrType, setQrType] = useState('website');
  const [qrPosition, setQrPosition] = useState('right');
  const [template, setTemplate] = useState('dark-minimal');
  const [aiDesign, setAiDesign] = useState<AIDesign | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIDesign = async () => {
    if (!data.title || !data.company) {
      toast.error("Please enter at least Job Title and Company Name for AI generation.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert UI/UX designer. Generate a modern, premium business card design for a ${data.title} at ${data.company}.
      The person's name is ${data.name || 'the user'}.
      Return a JSON object with the following structure:
      {
        "palette": {
          "bg": "hex color or css gradient (e.g. linear-gradient(...))",
          "text": "hex color",
          "accent": "hex color"
        },
        "font": "A popular Google Font name (e.g., 'Inter', 'Playfair Display', 'Space Grotesk', 'Outfit')",
        "tagline": "A short, catchy, professional tagline (max 6 words)",
        "layout": "minimal" | "modern" | "premium"
      }
      Make the design visually striking, modern, and appropriate for their industry.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              palette: {
                type: Type.OBJECT,
                properties: {
                  bg: { type: Type.STRING },
                  text: { type: Type.STRING },
                  accent: { type: Type.STRING }
                },
                required: ["bg", "text", "accent"]
              },
              font: { type: Type.STRING },
              tagline: { type: Type.STRING },
              layout: { type: Type.STRING }
            },
            required: ["palette", "font", "tagline", "layout"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}') as AIDesign;
      setAiDesign(result);
      setTemplate('ai-custom');
      
      if (result.font) {
        const fontUrl = `https://fonts.googleapis.com/css2?family=${result.font.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
        if (!document.querySelector(`link[href="${fontUrl}"]`)) {
          const link = document.createElement('link');
          link.href = fontUrl;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      }
      
      toast.success("AI Design generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI design. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${data.name.replace(/\s+/g, '-').toLowerCase() || 'business'}-card.png`;
      link.href = url;
      link.click();
      toast.success("Business card downloaded!");
    } catch (err) {
      toast.error("Failed to download card.");
    }
  };

  const copyContactInfo = () => {
    const info = `${data.name}\n${data.title} at ${data.company}\n${data.phone}\n${data.email}\n${data.website}`;
    navigator.clipboard.writeText(info);
    toast.success("Contact info copied to clipboard!");
  };

  const getQRValue = () => {
    switch (qrType) {
      case 'website': return data.website || 'https://example.com';
      case 'whatsapp': return `https://wa.me/${data.phone.replace(/[^0-9]/g, '')}`;
      case 'vcard': 
        return `BEGIN:VCARD\nVERSION:3.0\nN:${data.name}\nORG:${data.company}\nTITLE:${data.title}\nTEL:${data.phone}\nEMAIL:${data.email}\nURL:${data.website}\nEND:VCARD`;
      default: return data.website;
    }
  };

  const currentDesign = template === 'ai-custom' && aiDesign ? aiDesign : TEMPLATES[template];

  const renderCardContent = () => {
    const { layout, palette, font, tagline } = currentDesign;
    const { name, title, company, phone, email, website, address, logo } = data;
    
    const qrCode = (
      <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
        <QRCodeSVG value={getQRValue()} size={64} fgColor="#000000" bgColor="#ffffff" />
      </div>
    );

    if (layout === 'modern') {
      return (
        <div className="flex w-full h-full">
          <div className="w-1/3 h-full flex flex-col justify-between p-8" style={{ background: palette.accent, color: palette.bg }}>
            {logo ? (
              <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {company.charAt(0) || 'C'}
              </div>
            )}
            {qrPosition === 'left' && qrCode}
          </div>
          <div className="w-2/3 h-full p-8 flex flex-col justify-center relative">
            <h2 className="text-3xl font-bold tracking-tight mb-1">{name || 'Your Name'}</h2>
            <p className="text-sm font-medium opacity-80 mb-6" style={{ color: palette.accent }}>{title || 'Job Title'} | {company || 'Company'}</p>
            
            <div className="space-y-2 text-sm opacity-90">
              {phone && <p className="flex items-center gap-2"><span>📞</span> {phone}</p>}
              {email && <p className="flex items-center gap-2"><span>✉️</span> {email}</p>}
              {website && <p className="flex items-center gap-2"><span>🌐</span> {website}</p>}
              {address && <p className="flex items-center gap-2"><span>📍</span> {address}</p>}
            </div>
            
            {tagline && <p className="absolute bottom-8 left-8 text-xs italic opacity-60 max-w-[200px]">{tagline}</p>}
            
            {qrPosition === 'right' && (
              <div className="absolute bottom-8 right-8">
                {qrCode}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (layout === 'premium') {
      return (
        <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center relative">
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${palette.accent} 0%, transparent 70%)` }} />
          
          <div className="z-10 flex flex-col items-center">
            {logo && <img src={logo} alt="Logo" className="w-16 h-16 object-contain mb-4" />}
            <h2 className="text-4xl font-bold tracking-tight mb-2">{name || 'Your Name'}</h2>
            <div className="h-px w-12 mb-2" style={{ background: palette.accent }} />
            <p className="text-sm font-medium tracking-widest uppercase opacity-80 mb-6">{title || 'Job Title'} @ {company || 'Company'}</p>
            
            <div className="flex gap-6 text-xs opacity-90 mb-8">
              {phone && <span>{phone}</span>}
              {email && <span>{email}</span>}
              {website && <span>{website}</span>}
            </div>
            
            {tagline && <p className="text-sm italic opacity-70" style={{ color: palette.accent }}>{tagline}</p>}
          </div>
          
          {qrPosition !== 'none' && (
            <div className="absolute bottom-6 right-6 z-10">
              {qrCode}
            </div>
          )}
        </div>
      );
    }

    // minimal (default)
    return (
      <div className="w-full h-full p-10 flex flex-col justify-between relative">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-1">{name || 'Your Name'}</h2>
            <p className="text-lg opacity-80">{title || 'Job Title'}</p>
            <p className="text-sm font-medium mt-1" style={{ color: palette.accent }}>{company || 'Company Name'}</p>
          </div>
          {logo && <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />}
        </div>
        
        <div className="flex justify-between items-end">
          <div className="space-y-1.5 text-sm opacity-80">
            {phone && <p>{phone}</p>}
            {email && <p>{email}</p>}
            {website && <p>{website}</p>}
            {address && <p>{address}</p>}
          </div>
          
          <div className="flex flex-col items-end gap-4">
            {tagline && <p className="text-xs font-medium max-w-[200px] text-right" style={{ color: palette.accent }}>{tagline}</p>}
            {qrPosition !== 'none' && qrCode}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <div className="w-full md:w-[400px] lg:w-[450px] border-r bg-card flex flex-col h-screen z-10 shadow-xl">
        <div className="p-6 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              CardGen <span className="text-primary">AI</span>
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="rounded-full">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="details" className="rounded-lg">Details</TabsTrigger>
                <TabsTrigger value="design" className="rounded-lg">Design</TabsTrigger>
                <TabsTrigger value="qr" className="rounded-lg">QR Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" value={data.name} onChange={handleInputChange} placeholder="John Doe" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input id="title" name="title" value={data.title} onChange={handleInputChange} placeholder="CEO" className="bg-background" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" name="company" value={data.company} onChange={handleInputChange} placeholder="Acme Inc." className="bg-background" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" value={data.phone} onChange={handleInputChange} placeholder="+1 234 567 890" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" value={data.email} onChange={handleInputChange} placeholder="john@acme.com" className="bg-background" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" value={data.website} onChange={handleInputChange} placeholder="www.acme.com" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Input id="address" name="address" value={data.address} onChange={handleInputChange} placeholder="123 Main St, City" className="bg-background" />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      {data.logo && (
                        <div className="w-12 h-12 rounded border bg-background flex items-center justify-center overflow-hidden shrink-0">
                          <img src={data.logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Label htmlFor="logo-upload" className="flex items-center justify-center w-full h-12 px-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Upload Image</span>
                          <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </Label>
                      </div>
                      {data.logo && (
                        <Button variant="ghost" size="icon" onClick={() => setData({ ...data, logo: null })}>
                          &times;
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="design" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> AI Design Generator
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Let Gemini AI create a custom design based on your profession and company.
                      </p>
                    </div>
                    <Button 
                      className="w-full shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" 
                      onClick={generateAIDesign} 
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="mr-2"
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {isGenerating ? 'Generating Design...' : 'Generate AI Design'}
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Label>Pre-built Templates</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.keys(TEMPLATES).map((key) => (
                      <div 
                        key={key}
                        onClick={() => setTemplate(key)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${template === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full shadow-sm border"
                            style={{ background: TEMPLATES[key].palette.bg }}
                          />
                          <span className="font-medium capitalize">{key.replace('-', ' ')}</span>
                        </div>
                        {template === key && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    ))}
                    {aiDesign && (
                      <div 
                        onClick={() => setTemplate('ai-custom')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${template === 'ai-custom' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full shadow-sm border"
                            style={{ background: aiDesign.palette.bg }}
                          />
                          <span className="font-medium">Custom AI Design</span>
                        </div>
                        {template === 'ai-custom' && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="qr" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>QR Code Action</Label>
                    <Select value={qrType} onValueChange={setQrType}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Link to Website</SelectItem>
                        <SelectItem value="vcard">Save Contact (vCard)</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>QR Code Position</Label>
                    <Select value={qrPosition} onValueChange={setQrPosition}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">Bottom Right</SelectItem>
                        <SelectItem value="left">Bottom Left</SelectItem>
                        <SelectItem value="none">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t bg-card/50 backdrop-blur-sm space-y-3">
          <Button className="w-full rounded-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" onClick={downloadCard}>
            <Download className="w-5 h-5 mr-2" /> Download High-Res PNG
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="rounded-full" onClick={copyContactInfo}>
              <Copy className="w-4 h-4 mr-2" /> Copy Info
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => toast.info("Share feature coming soon!")}>
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>
      </div>
      
      {/* Preview Area */}
      <div className="flex-1 bg-muted/30 p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        
        <div className="mb-8 text-center z-10">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Live Preview</h2>
          <p className="text-muted-foreground text-sm">Changes apply in real-time</p>
        </div>

        {/* The Card Container */}
        <div className="relative z-10 perspective-[1000px]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={template + (aiDesign ? 'ai' : '')}
              initial={{ opacity: 0, rotateY: 10, scale: 0.95 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -10, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              className="group"
            >
              <div 
                ref={cardRef}
                className="relative w-[340px] h-[600px] md:w-[600px] md:h-[350px] rounded-2xl shadow-2xl overflow-hidden flex transition-all duration-500 group-hover:shadow-primary/20 group-hover:shadow-3xl border border-white/10"
                style={{
                  background: currentDesign.palette.bg,
                  color: currentDesign.palette.text,
                  fontFamily: currentDesign.font ? `'${currentDesign.font}', sans-serif` : 'Inter, sans-serif'
                }}
              >
                {renderCardContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="mt-12 flex items-center gap-4 text-sm text-muted-foreground z-10">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4" /> {currentDesign.layout} layout
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5">
            <TypeIcon className="w-4 h-4" /> {currentDesign.font || 'Inter'}
          </div>
        </div>
      </div>
    </div>
  );
}
