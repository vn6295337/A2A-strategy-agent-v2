import { cn } from "@/lib/utils"
import {
  User,
  Database,
  Search,
  Brain,
  MessageSquare,
  Edit3,
  FileOutput,
  Server,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Loader2,
  XCircle,
  MinusCircle,
  Network,
  GitBranch,
} from "lucide-react"
import type { MCPStatus } from "@/lib/api"

type NodeStatus = 'idle' | 'executing' | 'completed' | 'failed' | 'skipped'

interface ProcessFlowProps {
  currentStep: string
  completedSteps: string[]
  mcpStatus: MCPStatus
  llmProvider?: string
  cacheHit?: boolean
}

const mcpServers = [
  { id: 'financials', label: 'Financials' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'volatility', label: 'Volatility' },
  { id: 'macro', label: 'Macro' },
  { id: 'news', label: 'News' },
  { id: 'sentiment', label: 'Sentiment' },
]

function getNodeStatus(
  stepId: string,
  currentStep: string,
  completedSteps: string[],
  cacheHit?: boolean
): NodeStatus {
  if (completedSteps.includes(stepId)) return 'completed'
  if (currentStep === stepId) return 'executing'

  // If cache hit, skip researcher through editor
  if (cacheHit && ['researcher', 'analyzer', 'critic', 'editor'].includes(stepId)) {
    return 'skipped'
  }

  return 'idle'
}

const statusStyles = {
  idle: 'bg-gray-700 border-gray-600 opacity-60',
  executing: 'bg-emerald-600 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse',
  completed: 'bg-emerald-700 border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]',
  failed: 'bg-red-600 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]',
  skipped: 'bg-gray-700 border-gray-600 opacity-40 border-dashed',
}

function ProcessNode({
  icon: Icon,
  label,
  status,
  isDiamond = false,
  size = 'normal',
}: {
  icon: React.ElementType
  label: string
  status: NodeStatus
  isDiamond?: boolean
  size?: 'normal' | 'small'
}) {
  const StatusIcon = status === 'completed' ? CheckCircle :
                     status === 'executing' ? Loader2 :
                     status === 'failed' ? XCircle :
                     status === 'skipped' ? MinusCircle : null

  const nodeSize = size === 'small' ? 'w-10 h-10' : 'w-12 h-12'
  const iconSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'relative flex items-center justify-center border-2 transition-all duration-300',
          nodeSize,
          isDiamond ? 'rotate-45 rounded-md' : 'rounded-lg',
          statusStyles[status]
        )}
      >
        <div className={cn(isDiamond && '-rotate-45')}>
          {StatusIcon && status === 'executing' ? (
            <Loader2 className={cn(iconSize, 'text-white animate-spin')} />
          ) : StatusIcon ? (
            <StatusIcon className={cn(iconSize, 'text-white')} />
          ) : (
            <Icon className={cn(iconSize, 'text-white')} />
          )}
        </div>
      </div>
      <span className={cn(
        'text-xs font-medium transition-opacity duration-300 text-center',
        status === 'idle' || status === 'skipped' ? 'text-gray-500' : 'text-gray-300'
      )}>
        {label}
      </span>
      {status === 'skipped' && (
        <span className="text-[10px] text-gray-600">skipped</span>
      )}
    </div>
  )
}

function HorizontalConnector({ status }: { status: NodeStatus }) {
  return (
    <div className="flex items-center px-1 h-12">
      <div
        className={cn(
          'w-6 h-0.5 transition-all duration-300',
          status === 'completed' ? 'bg-emerald-500' :
          status === 'executing' ? 'bg-emerald-400 animate-pulse' :
          status === 'failed' ? 'bg-red-500' :
          'bg-gray-600'
        )}
      />
      <ArrowRight
        className={cn(
          'w-3 h-3 -ml-1 transition-all duration-300',
          status === 'completed' ? 'text-emerald-500' :
          status === 'executing' ? 'text-emerald-400' :
          status === 'failed' ? 'text-red-500' :
          'text-gray-600'
        )}
      />
    </div>
  )
}

function VerticalConnector({ status }: { status: NodeStatus }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div
        className={cn(
          'w-0.5 h-6 transition-all duration-300',
          status === 'completed' ? 'bg-emerald-500' :
          status === 'executing' ? 'bg-emerald-400 animate-pulse' :
          status === 'failed' ? 'bg-red-500' :
          'bg-gray-600'
        )}
      />
      <ArrowDown
        className={cn(
          'w-3 h-3 -mt-1 transition-all duration-300',
          status === 'completed' ? 'text-emerald-500' :
          status === 'executing' ? 'text-emerald-400' :
          status === 'failed' ? 'text-red-500' :
          'text-gray-600'
        )}
      />
    </div>
  )
}

function CornerConnector({ status, direction = 'down-right' }: { status: NodeStatus; direction?: 'down-right' | 'down-left' }) {
  const color = status === 'completed' ? 'border-emerald-500' :
                status === 'executing' ? 'border-emerald-400' :
                status === 'failed' ? 'border-red-500' :
                'border-gray-600'

  return (
    <div className={cn(
      'w-8 h-8 border-b-2 border-l-2 rounded-bl-lg',
      color,
      status === 'executing' && 'animate-pulse'
    )} />
  )
}

function MCPServerRow({ mcpStatus }: { mcpStatus: MCPStatus }) {
  return (
    <div className="flex items-center gap-1 bg-gray-800/60 backdrop-blur border border-gray-700 rounded-lg px-2 py-1.5">
      {mcpServers.map((server) => {
        const status = mcpStatus[server.id as keyof MCPStatus] || 'idle'
        return (
          <div
            key={server.id}
            className={cn(
              'flex flex-col items-center p-1.5 rounded border transition-all duration-300 min-w-[52px]',
              status === 'completed' ? 'bg-emerald-900/50 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
              status === 'executing' ? 'bg-emerald-800/50 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse' :
              status === 'failed' ? 'bg-red-900/50 border-red-600' :
              'bg-gray-800 border-gray-700 opacity-60'
            )}
          >
            <Server className={cn(
              'w-3.5 h-3.5 mb-0.5',
              status === 'completed' ? 'text-emerald-400' :
              status === 'executing' ? 'text-emerald-300' :
              status === 'failed' ? 'text-red-400' :
              'text-gray-500'
            )} />
            <span className={cn(
              'text-[9px] text-center leading-tight',
              status === 'completed' || status === 'executing' ? 'text-gray-300' : 'text-gray-500'
            )}>
              {server.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function LLMNode({ provider, status }: { provider?: string; status: NodeStatus }) {
  return (
    <div className={cn(
      'flex flex-col items-center',
      status === 'idle' && 'opacity-60'
    )}>
      <div className={cn(
        'w-0.5 h-4 transition-all duration-300',
        status === 'completed' ? 'bg-blue-500' :
        status === 'executing' ? 'bg-blue-400 animate-pulse' :
        'bg-gray-600'
      )} />
      <div className={cn(
        'px-3 py-1.5 rounded-lg border transition-all duration-300',
        status === 'executing' ? 'bg-blue-600 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse' :
        status === 'completed' ? 'bg-blue-700 border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.3)]' :
        'bg-gray-800 border-gray-700'
      )}>
        <div className="flex items-center gap-1.5">
          <Brain className={cn(
            'w-3.5 h-3.5',
            status === 'executing' || status === 'completed' ? 'text-blue-300' : 'text-gray-500'
          )} />
          <span className="text-xs font-medium text-gray-300">
            {provider || 'LLM'}
          </span>
        </div>
      </div>
    </div>
  )
}

function AgentEnclosure({
  children,
  llmProvider,
  llmStatus
}: {
  children: React.ReactNode
  llmProvider?: string
  llmStatus: NodeStatus
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-2 backdrop-blur">
        <div className="text-[10px] text-gray-500 text-center mb-1.5">LLM Agents</div>
        <div className="flex items-center">
          {children}
        </div>
      </div>
      <LLMNode provider={llmProvider} status={llmStatus} />
    </div>
  )
}

export function ProcessFlow({
  currentStep,
  completedSteps,
  mcpStatus,
  llmProvider,
  cacheHit = false,
}: ProcessFlowProps) {
  // Get statuses for each step
  const inputStatus = getNodeStatus('input', currentStep, completedSteps, cacheHit)
  const cacheStatus = getNodeStatus('cache', currentStep, completedSteps, cacheHit)
  const a2aClientStatus = getNodeStatus('a2a_client', currentStep, completedSteps, cacheHit)
  const analyzerStatus = getNodeStatus('analyzer', currentStep, completedSteps, cacheHit)
  const criticStatus = getNodeStatus('critic', currentStep, completedSteps, cacheHit)
  const editorStatus = getNodeStatus('editor', currentStep, completedSteps, cacheHit)
  const outputStatus = getNodeStatus('output', currentStep, completedSteps, cacheHit)
  const researcherStatus = getNodeStatus('researcher', currentStep, completedSteps, cacheHit)
  const exchangeMatchStatus = getNodeStatus('exchange_match', currentStep, completedSteps, cacheHit)

  // LLM status based on analyzer/critic/editor
  const llmActiveFor = ['analyzer', 'critic', 'editor'].find(step =>
    currentStep === step || (completedSteps.includes(step) && !completedSteps.includes('output'))
  )
  const llmStatus = llmActiveFor === currentStep ? 'executing' :
                    llmActiveFor ? 'completed' : 'idle'

  // Connector statuses
  const getConnectorStatus = (fromStatus: NodeStatus, toStatus: NodeStatus): NodeStatus => {
    if (fromStatus === 'completed' && toStatus !== 'idle') return 'completed'
    if (fromStatus === 'executing') return 'executing'
    return 'idle'
  }

  return (
    <div className="w-full bg-gray-900/50 border border-gray-800 rounded-xl p-4 overflow-x-auto">
      <div className="min-w-[900px] space-y-2">
        {/* Row 1: Main flow */}
        <div className="flex items-center justify-center">
          {/* User Input */}
          <div className="flex flex-col items-center">
            <ProcessNode icon={User} label="User Input" status={inputStatus} />
          </div>

          <HorizontalConnector status={getConnectorStatus(inputStatus, cacheStatus)} />

          {/* Check Cache */}
          <ProcessNode icon={Database} label="Check Cache" status={cacheStatus} isDiamond />

          <HorizontalConnector status={getConnectorStatus(cacheStatus, a2aClientStatus)} />

          {/* A2A Client */}
          <div className="flex flex-col items-center">
            <ProcessNode icon={Network} label="A2A Client" status={a2aClientStatus} />
          </div>

          <HorizontalConnector status={getConnectorStatus(a2aClientStatus, analyzerStatus)} />

          {/* Analyzer/Critic/Editor Enclosure */}
          <AgentEnclosure llmProvider={llmProvider} llmStatus={llmStatus}>
            <ProcessNode icon={Brain} label="Analyzer" status={analyzerStatus} size="small" />
            <HorizontalConnector status={getConnectorStatus(analyzerStatus, criticStatus)} />
            <ProcessNode icon={MessageSquare} label="Critic" status={criticStatus} size="small" />
            <HorizontalConnector status={getConnectorStatus(criticStatus, editorStatus)} />
            <ProcessNode icon={Edit3} label="Editor" status={editorStatus} size="small" />
          </AgentEnclosure>

          <HorizontalConnector status={getConnectorStatus(editorStatus, outputStatus)} />

          {/* Output */}
          <ProcessNode icon={FileOutput} label="Output" status={outputStatus} />
        </div>

        {/* Vertical connectors to Row 2 */}
        <div className="flex justify-start pl-[52px] gap-[280px]">
          {/* Vertical from User Input to Exchange Match */}
          <div className="flex flex-col items-center">
            <VerticalConnector status={getConnectorStatus(inputStatus, exchangeMatchStatus)} />
          </div>

          {/* Corner from A2A Client down to Researcher */}
          <div className="flex items-start">
            <div className="flex flex-col items-center">
              <VerticalConnector status={getConnectorStatus(a2aClientStatus, researcherStatus)} />
            </div>
          </div>
        </div>

        {/* Row 2: Exchange Match + Researcher + MCP Servers */}
        <div className="flex items-start justify-start pl-[26px] gap-[200px]">
          {/* Exchange Matching */}
          <ProcessNode icon={GitBranch} label="Exchange Match" status={exchangeMatchStatus} />

          {/* Researcher + MCP Servers */}
          <div className="flex items-center gap-3">
            <ProcessNode icon={Search} label="Researcher" status={researcherStatus} />
            <div className="flex items-center h-12">
              <div className={cn(
                'w-4 h-0.5',
                researcherStatus === 'completed' ? 'bg-emerald-500' :
                researcherStatus === 'executing' ? 'bg-emerald-400 animate-pulse' :
                'bg-gray-600'
              )} />
            </div>
            <MCPServerRow mcpStatus={mcpStatus} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcessFlow
