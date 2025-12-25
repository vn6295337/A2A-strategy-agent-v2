import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { startAnalysis, getWorkflowStatus, getWorkflowResult, checkHealth } from "@/lib/api"
import { AnalysisResponse } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  FileText,
  Settings,
  RefreshCw,
  Zap,
  Database,
  GitBranch,
  Play,
  Sun,
  Moon,
  Menu,
  Copy,
  Download,
  Printer,
  Check,
} from "lucide-react"

// Sample SWOT data for Tesla
const swotData = {
  company: "Tesla",
  score: 8.2,
  revisionCount: 1,
  reportLength: 2847,
  strengths: [
    "Market leader in electric vehicles with strong brand recognition",
    "Vertically integrated supply chain and in-house battery production",
    "Advanced autonomous driving technology and continuous OTA updates",
    "Supercharger network providing competitive advantage",
  ],
  weaknesses: [
    "Production quality inconsistencies and service center capacity",
    "Heavy reliance on CEO public persona and social media presence",
    "Limited model variety compared to traditional automakers",
    "High vehicle prices limiting mass-market accessibility",
  ],
  opportunities: [
    "Expanding global EV market and government incentives",
    "Energy storage and solar business growth potential",
    "Autonomous ride-sharing and robotaxi services",
    "New market entry in developing economies",
  ],
  threats: [
    "Increasing competition from legacy automakers and new EV startups",
    "Supply chain disruptions and raw material cost volatility",
    "Regulatory changes and subsidy reductions",
    "Economic downturns affecting luxury vehicle sales",
  ],
  critique:
    "The analysis provides comprehensive coverage of Tesla's strategic position. Strengths and opportunities are well-articulated with specific examples. Recommend adding more quantitative data points for market share and financial metrics. Overall quality meets professional standards.",
}

const loadingSteps = [
  { label: "Initializing research agent", icon: Database },
  { label: "Gathering company data", icon: FileText },
  { label: "Analyzing market position", icon: BarChart3 },
  { label: "Generating SWOT draft", icon: Brain },
  { label: "Evaluating quality", icon: Target },
  { label: "Refining analysis", icon: RefreshCw },
]

// Map backend step names to UI step indices
const stepMap: Record<string, number> = {
  starting: 0,
  Researcher: 1,
  Analyst: 2,
  Critic: 3,
  Editor: 4,
}

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App

const STRATEGIES = [
  { value: "Cost Leadership", label: "Cost Leadership" },
  { value: "Differentiation", label: "Differentiation" },
  { value: "Focus/Niche", label: "Focus/Niche" },
]

// Sidebar content component - shared between desktop sidebar and mobile sheet
interface SidebarContentProps {
  company: string
  setCompany: (value: string) => void
  strategy: string
  setStrategy: (value: string) => void
  isLoading: boolean
  handleGenerate: () => void
  currentStep: number
}

const SidebarContent = ({
  company,
  setCompany,
  strategy,
  setStrategy,
  isLoading,
  handleGenerate,
  currentStep,
}: SidebarContentProps) => (
  <div className="space-y-6">
    {/* Input Card */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Company Name
          </label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter company name"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Strategic Lens
          </label>
          <Select
            value={strategy}
            onValueChange={setStrategy}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              {STRATEGIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !company.trim()}
          className="w-full gap-2 btn-glow"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isLoading ? "Processing..." : "Generate SWOT"}
        </Button>
      </CardContent>
    </Card>

    {/* Process Steps Card */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" />
          Agent Workflow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loadingSteps.map((step, index) => {
            const Icon = step.icon
            const isComplete = currentStep > index
            const isCurrent = currentStep === index + 1 && isLoading

            return (
              <div
                key={index}
                className={`flex items-center gap-3 text-sm transition-opacity ${
                  isComplete || isCurrent
                    ? "opacity-100"
                    : "opacity-40"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    isComplete
                      ? "bg-success text-success-foreground"
                      : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : isCurrent ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={
                    isComplete || isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>

    {/* About Card */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">How It Works</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>
          The system uses a multi-agent architecture with automatic
          quality control:
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li>Researcher gathers data</li>
          <li>Analyst creates SWOT draft</li>
          <li>Critic evaluates quality (1-10)</li>
          <li>Editor improves if score &lt; 7</li>
        </ol>
        <p className="pt-2">
          Loop continues until quality ≥ 7 or max 3 revisions.
        </p>
      </CardContent>
    </Card>
  </div>
)

const Index = () => {
  const [company, setCompany] = useState("Tesla")
  const [strategy, setStrategy] = useState("Cost Leadership")
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [activeTab, setActiveTab] = useState("analysis")
  const [isDark, setIsDark] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [revisionCount, setRevisionCount] = useState(0)
  const [score, setScore] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useIsMobile()

  // Export functions
  const formatSwotForClipboard = () => {
    const data = analysisResult || analysisData
    return `SWOT Analysis: ${data.company_name}
Strategy Focus: ${strategy}
Quality Score: ${data.score}/10
Revisions: ${data.revision_count}

STRENGTHS:
${data.swot_data.strengths.map(s => `• ${s}`).join('\n')}

WEAKNESSES:
${data.swot_data.weaknesses.map(w => `• ${w}`).join('\n')}

OPPORTUNITIES:
${data.swot_data.opportunities.map(o => `• ${o}`).join('\n')}

THREATS:
${data.swot_data.threats.map(t => `• ${t}`).join('\n')}

QUALITY EVALUATION:
${data.critique}

---
Generated by A2A Strategy Agent`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatSwotForClipboard())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadAsJson = () => {
    const data = analysisResult || analysisData
    const exportData = {
      company_name: data.company_name,
      strategy_focus: strategy,
      score: data.score,
      revision_count: data.revision_count,
      swot_data: data.swot_data,
      critique: data.critique,
      exported_at: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `swot-analysis-${data.company_name.toLowerCase().replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const printAnalysis = () => {
    window.print()
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const handleGenerate = async () => {
    setIsLoading(true)
    setShowResults(false)
    setCurrentStep(0)
    setRevisionCount(0)
    setScore(0)

    try {
      // Start analysis workflow
      const { workflow_id } = await startAnalysis(company, strategy)
      setWorkflowId(workflow_id)
      
      // Start polling for status updates
      const startPolling = () => {
        pollingRef.current = setInterval(async () => {
          try {
            const status = await getWorkflowStatus(workflow_id)
            
            // Update UI with current progress
            setRevisionCount(status.revision_count)
            setScore(status.score)
            
            // Map backend step to UI step
            const stepIndex = stepMap[status.current_step] || 0
            setCurrentStep(stepIndex)
            
            // If workflow is completed, get results and stop polling
            if (status.status === "completed") {
              clearInterval(pollingRef.current!)
              pollingRef.current = null
              
              const result = await getWorkflowResult(workflow_id)
              setAnalysisResult(result)
              setIsLoading(false)
              setShowResults(true)
            } else if (status.status === "error") {
              clearInterval(pollingRef.current!)
              pollingRef.current = null
              setIsLoading(false)
              setShowResults(true)
              // In a real app, you'd show an error message here
            }
          } catch (error) {
            console.error("Polling error:", error)
            // Continue polling even if one request fails
          }
        }, 700) // Poll every 700ms
      }
      
      startPolling()
      
    } catch (error) {
      console.error("Error starting analysis:", error)
      setIsLoading(false)
      // Show error state
      setShowResults(true)
    }
  }

  // Clean up polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-success"
    if (score >= 5) return "text-warning"
    return "text-destructive"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 7)
      return { label: "High Quality", variant: "default" as const, icon: CheckCircle }
    if (score >= 5)
      return { label: "Acceptable", variant: "secondary" as const, icon: AlertCircle }
    return { label: "Needs Improvement", variant: "destructive" as const, icon: XCircle }
  }

  // Use analysis result if available, otherwise use sample data
  const analysisData = analysisResult || {
    company_name: company,
    score: score || 8.2,
    revision_count: revisionCount || 1,
    report_length: 2847,
    critique: "The analysis provides comprehensive coverage of Tesla's strategic position. Strengths and opportunities are well-articulated with specific examples. Recommend adding more quantitative data points for market share and financial metrics. Overall quality meets professional standards.",
    swot_data: {
      strengths: [
        "Market leader in electric vehicles with strong brand recognition",
        "Vertically integrated supply chain and in-house battery production",
        "Advanced autonomous driving technology and continuous OTA updates",
        "Supercharger network providing competitive advantage",
      ],
      weaknesses: [
        "Production quality inconsistencies and service center capacity",
        "Heavy reliance on CEO public persona and social media presence",
        "Limited model variety compared to traditional automakers",
        "High vehicle prices limiting mass-market accessibility",
      ],
      opportunities: [
        "Expanding global EV market and government incentives",
        "Energy storage and solar business growth potential",
        "Autonomous ride-sharing and robotaxi services",
        "New market entry in developing economies",
      ],
      threats: [
        "Increasing competition from legacy automakers and new EV startups",
        "Supply chain disruptions and raw material cost volatility",
        "Regulatory changes and subsidy reductions",
        "Economic downturns affecting luxury vehicle sales",
      ],
    }
  }

  const swotData = {
    company: analysisData.company_name,
    score: analysisData.score,
    revisionCount: analysisData.revision_count,
    reportLength: analysisData.report_length,
    critique: analysisData.critique,
    strengths: analysisData.swot_data.strengths,
    weaknesses: analysisData.swot_data.weaknesses,
    opportunities: analysisData.swot_data.opportunities,
    threats: analysisData.swot_data.threats,
  }

  const scoreBadge = getScoreBadge(swotData.score)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Button */}
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Configuration
                      </SheetTitle>
                    </SheetHeader>
                    <SidebarContent
                      company={company}
                      setCompany={setCompany}
                      strategy={strategy}
                      setStrategy={setStrategy}
                      isLoading={isLoading}
                      handleGenerate={() => {
                        setSidebarOpen(false)
                        handleGenerate()
                      }}
                      currentStep={currentStep}
                    />
                  </SheetContent>
                </Sheet>
              )}
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                  A2A Strategy Agent
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Strategic SWOT Analysis with Self-Correcting AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="gap-1.5 hidden sm:flex">
                <Zap className="h-3 w-3" />
                <span className="hidden md:inline">Agentic Automation Demo</span>
                <span className="md:hidden">Demo</span>
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="h-8 w-8"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Desktop Sidebar - hidden on mobile */}
          {!isMobile && (
            <aside className="hidden lg:block">
              <SidebarContent
                company={company}
                setCompany={setCompany}
                strategy={strategy}
                setStrategy={setStrategy}
                isLoading={isLoading}
                handleGenerate={handleGenerate}
                currentStep={currentStep}
              />
            </aside>
          )}

          {/* Main Content */}
          <main className="space-y-6">
            {!showResults && !isLoading && (
              <Card className="flex flex-col items-center justify-center py-16">
                <Brain className="text-4xl text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-medium text-foreground mb-2">
                  Ready to Analyze
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Enter a company name and click "Generate SWOT" to see the
                  self-correcting AI agent in action.
                </p>
              </Card>
            )}

            {isLoading && (
              <Card className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <RefreshCw className="text-3xl text-primary animate-spin mb-4" />
                <h2 className="text-xl font-medium text-foreground mb-2">
                  Analyzing {company}
                </h2>
                <p className="text-muted-foreground">
                  {loadingSteps[currentStep - 1]?.label || "Initializing..."}
                </p>
                <Progress
                  value={(currentStep / loadingSteps.length) * 100}
                  className="w-64 mt-4"
                />
                {currentStep >= 3 && ( // Show score/revision info starting from Critic step
                  <div className="mt-4 text-center text-sm">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Current Score</p>
                        <p className={`font-bold ${getScoreColor(score)}`}>{score}/10</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Revisions</p>
                        <p className="font-bold text-foreground">{revisionCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {showResults && (
              <div className="space-y-4 sm:space-y-6 animate-slide-up print:animate-none">
                {/* Results Header */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                        {swotData.company} Analysis
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Strategic assessment completed
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Quality Score
                        </p>
                        <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(swotData.score)}`}>
                          {swotData.score}/10
                        </p>
                      </div>
                      <Badge variant={scoreBadge.variant} className="gap-1.5 text-xs sm:text-sm">
                        <scoreBadge.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{scoreBadge.label}</span>
                        <span className="sm:hidden">{scoreBadge.label.split(' ')[0]}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadAsJson}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Download JSON</span>
                      <span className="sm:hidden">JSON</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={printAnalysis}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Print / PDF</span>
                      <span className="sm:hidden">Print</span>
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger value="analysis" className="gap-1.5 px-2 py-2 sm:px-4 text-xs sm:text-sm">
                      <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">SWOT Analysis</span>
                      <span className="sm:hidden">SWOT</span>
                    </TabsTrigger>
                    <TabsTrigger value="quality" className="gap-1.5 px-2 py-2 sm:px-4 text-xs sm:text-sm">
                      <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Quality Evaluation</span>
                      <span className="sm:hidden">Quality</span>
                    </TabsTrigger>
                    <TabsTrigger value="details" className="gap-1.5 px-2 py-2 sm:px-4 text-xs sm:text-sm">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Process Details</span>
                      <span className="sm:hidden">Details</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Strengths */}
                      <Card className="border-l-4 border-l-strength">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base text-strength">
                            <TrendingUp />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {swotData.strengths.map((item, i) => (
                              <li
                                key={i}
                                className="flex gap-2 text-sm text-foreground"
                              >
                                <CheckCircle className="text-strength shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Weaknesses */}
                      <Card className="border-l-4 border-l-weakness">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base text-weakness">
                            <TrendingDown />
                            Weaknesses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {swotData.weaknesses.map((item, i) => (
                              <li
                                key={i}
                                className="flex gap-2 text-sm text-foreground"
                              >
                                <XCircle className="text-weakness shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Opportunities */}
                      <Card className="border-l-4 border-l-opportunity">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base text-opportunity">
                            <Target />
                            Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {swotData.opportunities.map((item, i) => (
                              <li
                                key={i}
                                className="flex gap-2 text-sm text-foreground"
                              >
                                <Zap className="text-opportunity shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Threats */}
                      <Card className="border-l-4 border-l-threat">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base text-threat">
                            <AlertTriangle />
                            Threats
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {swotData.threats.map((item, i) => (
                              <li
                                key={i}
                                className="flex gap-2 text-sm text-foreground"
                              >
                                <AlertCircle className="text-threat shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="quality" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Quality Metrics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">
                                Overall Score
                              </span>
                              <span className={`font-medium ${getScoreColor(swotData.score)}`}>
                                {swotData.score}/10
                              </span>
                            </div>
                            <Progress
                              value={swotData.score * 10}
                              className="h-2"
                            />
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold text-foreground">
                                {swotData.revisionCount}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Revisions Made
                              </p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold text-foreground">
                                {swotData.reportLength.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Characters
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Critic Evaluation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {swotData.critique}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Process Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-border">
                              <span className="text-muted-foreground">
                                Company
                              </span>
                              <span className="font-medium">
                                {swotData.company}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                              <span className="text-muted-foreground">
                                Strategy Focus
                              </span>
                              <span className="font-medium">
                                Cost Leadership
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                              <span className="text-muted-foreground">
                                Report Length
                              </span>
                              <span className="font-medium">
                                {swotData.reportLength.toLocaleString()} chars
                              </span>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg bg-muted/50">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <RefreshCw />
                              Self-Correcting Process
                            </h4>
                            <ol className="text-sm text-muted-foreground space-y-2">
                              <li className="flex gap-2">
                                <span className="font-medium text-foreground">
                                  1.
                                </span>
                                Researcher gathers company data
                              </li>
                              <li className="flex gap-2">
                                <span className="font-medium text-foreground">
                                  2.
                                </span>
                                Analyst creates initial SWOT draft
                              </li>
                              <li className="flex gap-2">
                                <span className="font-medium text-foreground">
                                  3.
                                </span>
                                Critic evaluates quality (1-10 scale)
                              </li>
                              <li className="flex gap-2">
                                <span className="font-medium text-foreground">
                                  4.
                                </span>
                                If score &lt; 7, Editor improves draft
                              </li>
                              <li className="flex gap-2">
                                <span className="font-medium text-foreground">
                                  5.
                                </span>
                                Loop until quality ≥ 7 or max 3 revisions
                              </li>
                            </ol>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <GitBranch />
                          <span>
                            Workflow: Researcher → Analyst → Critic → Editor (loop)
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
              <span className="flex items-center gap-1.5">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI-powered strategic analysis</span>
                <span className="sm:hidden">AI Analysis</span>
              </span>
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Automatic quality improvement</span>
                <span className="sm:hidden">Auto Quality</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Data-driven insights</span>
                <span className="sm:hidden">Insights</span>
              </span>
            </div>
            <span className="text-center">A2A Strategy Agent Demo</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Page Not Found</p>
        <Button onClick={() => window.location.href = '/'}>Go Home</Button>
      </div>
    </div>
  )
}