import { useState, useEffect } from "react"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Progress } from "./components/ui/progress"
import { Badge } from "./components/ui/badge"
import { Separator } from "./components/ui/separator"
import { startAnalysis, getAnalysisStatus, processWorkflow, checkHealth } from "./lib/api"
import { AnalysisResponse } from "./lib/types"

// Mock icons - we'll replace these with proper imports later
const Brain = () => <span>🧠</span>
const TrendingUp = () => <span>📈</span>
const TrendingDown = () => <span>📉</span>
const Target = () => <span>🎯</span>
const AlertTriangle = () => <span>⚠️</span>
const CheckCircle = () => <span>✅</span>
const XCircle = () => <span>❌</span>
const AlertCircle = () => <span>ℹ️</span>
const BarChart3 = () => <span>📊</span>
const FileText = () => <span>📄</span>
const Settings = () => <span>⚙️</span>
const RefreshCw = () => <span>🔄</span>
const Zap = () => <span>⚡</span>
const Database = () => <span>🗃️</span>
const GitBranch = () => <span>🌳</span>
const Play = () => <span>▶️</span>
const Sun = () => <span>☀️</span>
const Moon = () => <span>🌙</span>

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

export default function App() {
  const [company, setCompany] = useState("Tesla")
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [activeTab, setActiveTab] = useState("analysis")
  const [isDark, setIsDark] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const handleGenerate = async () => {
    setIsLoading(true)
    setShowResults(false)
    setCurrentStep(0)

    try {
      // Start analysis
      const response = await startAnalysis(company)
      const workflowId = `${company.toLowerCase().replace(' ', '_')}_workflow`
      
      // Process workflow step by step
      for (let i = 0; i < loadingSteps.length; i++) {
        const result = await processWorkflow(workflowId)
        setCurrentStep(i + 1)
        
        // If workflow is completed, break early
        if (result.status === "completed") {
          break
        }
        
        // Small delay to simulate processing
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Get final results
      const finalResult = await getAnalysisStatus(workflowId)
      
      // Get structured SWOT data
      const swotData = await getSwotData(workflowId)
      
      // Combine results
      setAnalysisResult({
        ...finalResult,
        swot_data: swotData
      })
      
      setIsLoading(false)
      setShowResults(true)
    } catch (error) {
      console.error("Error during analysis:", error)
      setIsLoading(false)
      // Show error state
      setShowResults(true)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-600 dark:text-green-400"
    if (score >= 5) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
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
    score: 8.2,
    revision_count: 1,
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
    ...analysisData.swot_data
  }

  const scoreBadge = getScoreBadge(swotData.score)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Brain />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  A2A Strategy Agent
                </h1>
                <p className="text-sm text-muted-foreground">
                  Strategic SWOT Analysis with Self-Correcting AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5">
                <Zap />
                Agentic Automation Demo
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="h-8 w-8"
              >
                {isDark ? <Sun /> : <Moon />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Input Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings />
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
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !company.trim()}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <RefreshCw />
                  ) : (
                    <Play />
                  )}
                  {isLoading ? "Processing..." : "Generate SWOT"}
                </Button>
              </CardContent>
            </Card>

            {/* Process Steps Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitBranch />
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
                              ? "bg-green-500 text-white"
                              : isCurrent
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle />
                          ) : isCurrent ? (
                            <RefreshCw />
                          ) : (
                            <Icon />
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
          </aside>

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
              </Card>
            )}

            {showResults && (
              <div className="space-y-6 animate-slide-up">
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {swotData.company} Analysis
                    </h2>
                    <p className="text-muted-foreground">
                      Strategic assessment completed
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Quality Score
                      </p>
                      <p className={`text-2xl font-bold ${getScoreColor(swotData.score)}`}>
                        {swotData.score}/10
                      </p>
                    </div>
                    <Badge variant={scoreBadge.variant} className="gap-1.5">
                      <scoreBadge.icon />
                      {scoreBadge.label}
                    </Badge>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analysis" className="gap-2">
                      <BarChart3 />
                      SWOT Analysis
                    </TabsTrigger>
                    <TabsTrigger value="quality" className="gap-2">
                      <Target />
                      Quality Evaluation
                    </TabsTrigger>
                    <TabsTrigger value="details" className="gap-2">
                      <FileText />
                      Process Details
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Strengths */}
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base text-green-600">
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
                                <CheckCircle className="text-green-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Weaknesses */}
                      <Card className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base text-red-600">
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
                                <XCircle className="text-red-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Opportunities */}
                      <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base text-blue-600">
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
                                <Zap className="text-blue-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Threats */}
                      <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base text-yellow-600">
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
                                <AlertCircle className="text-yellow-500" />
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
                            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <p className="text-2xl font-bold text-foreground">
                                {swotData.revisionCount}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Revisions Made
                              </p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
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

                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Brain />
                AI-powered strategic analysis
              </span>
              <span className="flex items-center gap-2">
                <RefreshCw />
                Automatic quality improvement
              </span>
              <span className="flex items-center gap-2">
                <Target />
                Data-driven insights
              </span>
            </div>
            <span>A2A Strategy Agent Demo</span>
          </div>
        </div>
      </footer>
    </div>
  )
}