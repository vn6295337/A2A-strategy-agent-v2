import {
  User,
  Database,
  Search,
  Brain,
  MessageSquare,
  Edit3,
  FileOutput,
  Server,
  Loader2,
  Network,
  GitBranch,
} from "lucide-react"
import type { MCPStatus } from "@/lib/api"

type NodeStatus = 'idle' | 'executing' | 'completed' | 'failed' | 'skipped'
type CacheState = 'idle' | 'hit' | 'miss' | 'checking'

interface ProcessFlowProps {
  currentStep: string
  completedSteps: string[]
  mcpStatus: MCPStatus
  llmProvider?: string
  cacheHit?: boolean
}

// === CONSTANTS ===

const NODE_SIZE = 44
const MCP_SIZE = 40
const LLM_WIDTH = 50
const LLM_HEIGHT = 24

// Row Y positions
const ROW1_Y = 55
const ROW2_Y = 135
const ROW3_Y = 215

// Node X positions
const NODES = {
  input: { x: 50, y: ROW1_Y },
  cache: { x: 140, y: ROW1_Y },
  a2a: { x: 230, y: ROW1_Y },
  analyzer: { x: 360, y: ROW1_Y },
  critic: { x: 460, y: ROW1_Y },
  editor: { x: 560, y: ROW1_Y },
  output: { x: 850, y: ROW1_Y },
  exchange: { x: 50, y: ROW2_Y },
  researcher: { x: 50, y: ROW3_Y },
}

// MCP Server positions
const MCP_SERVERS = [
  { id: 'financials', label: 'Fin', x: 180 },
  { id: 'valuation', label: 'Val', x: 230 },
  { id: 'volatility', label: 'Vol', x: 280 },
  { id: 'macro', label: 'Mac', x: 330 },
  { id: 'news', label: 'News', x: 380 },
  { id: 'sentiment', label: 'Sent', x: 430 },
]

// LLM Provider positions
const LLM_PROVIDERS = [
  { name: 'Groq', x: 360 },
  { name: 'Gemini', x: 460 },
  { name: 'OpenRouter', x: 560 },
]

// === HELPER FUNCTIONS ===

function getNodeStatus(
  stepId: string,
  currentStep: string,
  completedSteps: string[],
  cacheHit?: boolean
): NodeStatus {
  if (completedSteps.includes(stepId)) return 'completed'
  if (currentStep === stepId) return 'executing'
  if (cacheHit && ['researcher', 'analyzer', 'critic', 'editor', 'a2a_client'].includes(stepId)) {
    return 'skipped'
  }
  return 'idle'
}

function getStatusColor(status: NodeStatus): { fill: string; stroke: string } {
  switch (status) {
    case 'executing':
      return { fill: '#059669', stroke: '#34D399' }
    case 'completed':
      return { fill: '#047857', stroke: '#10B981' }
    case 'failed':
      return { fill: '#DC2626', stroke: '#F87171' }
    case 'skipped':
      return { fill: '#374151', stroke: '#4B5563' }
    default:
      return { fill: '#374151', stroke: '#4B5563' }
  }
}

function getCacheColor(state: CacheState): { fill: string; stroke: string } {
  switch (state) {
    case 'checking':
      return { fill: '#059669', stroke: '#34D399' }
    case 'hit':
      return { fill: '#047857', stroke: '#10B981' }
    case 'miss':
      return { fill: '#D97706', stroke: '#FBBF24' }
    default:
      return { fill: '#374151', stroke: '#4B5563' }
  }
}

function getConnectorColor(status: NodeStatus): string {
  switch (status) {
    case 'completed':
      return '#10B981'
    case 'executing':
      return '#34D399'
    default:
      return '#4B5563'
  }
}

// === SVG COMPONENTS ===

function SVGNode({
  x,
  y,
  icon: Icon,
  label,
  status,
  isDiamond = false,
  cacheState,
}: {
  x: number
  y: number
  icon: React.ElementType
  label: string
  status: NodeStatus
  isDiamond?: boolean
  cacheState?: CacheState
}) {
  const colors = cacheState ? getCacheColor(cacheState) : getStatusColor(status)
  const isActive = status === 'executing' || cacheState === 'checking'
  const opacity = status === 'idle' && !cacheState ? 0.5 : status === 'skipped' ? 0.4 : 1

  return (
    <g opacity={opacity}>
      {/* Node container */}
      <rect
        x={x - NODE_SIZE / 2}
        y={y - NODE_SIZE / 2}
        width={NODE_SIZE}
        height={NODE_SIZE}
        rx={isDiamond ? 4 : 8}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
        strokeDasharray={status === 'skipped' ? '4 2' : undefined}
        transform={isDiamond ? `rotate(45 ${x} ${y})` : undefined}
      >
        {isActive && (
          <animate
            attributeName="opacity"
            values="1;0.6;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Glow effect for active nodes */}
      {isActive && (
        <rect
          x={x - NODE_SIZE / 2 - 4}
          y={y - NODE_SIZE / 2 - 4}
          width={NODE_SIZE + 8}
          height={NODE_SIZE + 8}
          rx={isDiamond ? 6 : 10}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={1}
          opacity={0.3}
          transform={isDiamond ? `rotate(45 ${x} ${y})` : undefined}
        >
          <animate
            attributeName="opacity"
            values="0.3;0.1;0.3"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
      )}

      {/* Icon */}
      <foreignObject
        x={x - 10}
        y={y - 10}
        width={20}
        height={20}
      >
        <div className="flex items-center justify-center w-full h-full">
          {isActive ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Icon className="w-5 h-5 text-white" />
          )}
        </div>
      </foreignObject>

      {/* Label */}
      <text
        x={x}
        y={y + NODE_SIZE / 2 + 14}
        textAnchor="middle"
        className="text-[10px] font-medium"
        fill={status === 'idle' || status === 'skipped' ? '#6B7280' : '#D1D5DB'}
      >
        {label}
      </text>
    </g>
  )
}

function MCPServer({
  x,
  y,
  label,
  status,
}: {
  x: number
  y: number
  label: string
  status: NodeStatus
}) {
  const colors = getStatusColor(status)
  const isActive = status === 'executing'
  const opacity = status === 'idle' ? 0.5 : 1

  return (
    <g opacity={opacity}>
      <rect
        x={x - MCP_SIZE / 2}
        y={y - MCP_SIZE / 2}
        width={MCP_SIZE}
        height={MCP_SIZE}
        rx={4}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={1}
      >
        {isActive && (
          <animate
            attributeName="opacity"
            values="1;0.6;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      <foreignObject
        x={x - 6}
        y={y - 10}
        width={12}
        height={12}
      >
        <div className="flex items-center justify-center w-full h-full">
          <Server className="w-3 h-3 text-white" />
        </div>
      </foreignObject>

      <text
        x={x}
        y={y + 8}
        textAnchor="middle"
        className="text-[8px]"
        fill="#9CA3AF"
      >
        {label}
      </text>
    </g>
  )
}

function LLMProvider({
  x,
  y,
  name,
  status,
}: {
  x: number
  y: number
  name: string
  status: NodeStatus
}) {
  const isActive = status === 'executing'
  const isCompleted = status === 'completed'

  const fill = isCompleted ? 'rgba(30, 58, 138, 0.5)' :
               isActive ? 'rgba(30, 64, 175, 0.5)' :
               'rgba(31, 41, 55, 1)'
  const stroke = isCompleted ? '#2563EB' :
                 isActive ? '#3B82F6' :
                 '#374151'
  const textColor = isCompleted ? '#93C5FD' :
                    isActive ? '#BFDBFE' :
                    '#6B7280'
  const opacity = status === 'idle' ? 0.5 : 1

  return (
    <g opacity={opacity}>
      <rect
        x={x - LLM_WIDTH / 2}
        y={y - LLM_HEIGHT / 2}
        width={LLM_WIDTH}
        height={LLM_HEIGHT}
        rx={4}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      >
        {isActive && (
          <animate
            attributeName="opacity"
            values="1;0.6;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      <text
        x={x}
        y={y + 3}
        textAnchor="middle"
        className="text-[9px] font-medium"
        fill={textColor}
      >
        {name}
      </text>
    </g>
  )
}

function GroupBox({
  x,
  y,
  width,
  height,
}: {
  x: number
  y: number
  width: number
  height: number
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={8}
      fill="rgba(31, 41, 55, 0.3)"
      stroke="#374151"
      strokeWidth={1}
    />
  )
}

// === MAIN COMPONENT ===

export function ProcessFlow({
  currentStep,
  completedSteps,
  mcpStatus,
  cacheHit = false,
}: ProcessFlowProps) {
  // Calculate statuses
  const inputStatus = getNodeStatus('input', currentStep, completedSteps, cacheHit)
  const a2aStatus = getNodeStatus('a2a_client', currentStep, completedSteps, cacheHit)
  const analyzerStatus = getNodeStatus('analyzer', currentStep, completedSteps, cacheHit)
  const criticStatus = getNodeStatus('critic', currentStep, completedSteps, cacheHit)
  const editorStatus = getNodeStatus('editor', currentStep, completedSteps, cacheHit)
  const outputStatus = getNodeStatus('output', currentStep, completedSteps, cacheHit)
  const researcherStatus = getNodeStatus('researcher', currentStep, completedSteps, cacheHit)
  const exchangeStatus = getNodeStatus('exchange_match', currentStep, completedSteps, cacheHit)

  // Cache state
  const cacheState: CacheState =
    currentStep === 'cache' ? 'checking' :
    completedSteps.includes('cache') ? (cacheHit ? 'hit' : 'miss') :
    'idle'

  // LLM status
  const llmActive = ['analyzer', 'critic', 'editor'].some(s =>
    currentStep === s || completedSteps.includes(s)
  )
  const llmStatus: NodeStatus = ['analyzer', 'critic', 'editor'].some(s => currentStep === s)
    ? 'executing'
    : llmActive ? 'completed' : 'idle'

  // Connector status helper
  const conn = (from: NodeStatus, to: NodeStatus): NodeStatus =>
    from === 'completed' && to !== 'idle' ? 'completed' :
    from === 'executing' ? 'executing' : 'idle'

  // Bypass connector status (for cache hit path)
  const bypassStatus: NodeStatus = cacheHit && completedSteps.includes('cache') ? 'completed' : 'idle'

  return (
    <div className="w-full p-4 overflow-x-auto">
      <svg
        viewBox="0 0 900 280"
        preserveAspectRatio="xMidYMid meet"
        className="w-full min-w-[900px]"
        style={{ minHeight: '280px' }}
      >
        {/* === CONNECTORS (rendered first, behind nodes) === */}

        {/* Cache bypass elbow (above Row 1) */}
        <path
          d={`M ${NODES.cache.x} ${NODES.cache.y - NODE_SIZE/2 - 5}
              L ${NODES.cache.x} 15
              L ${NODES.output.x} 15
              L ${NODES.output.x} ${NODES.output.y - NODE_SIZE/2 - 5}`}
          stroke={getConnectorColor(bypassStatus)}
          strokeWidth={2}
          fill="none"
        />

        {/* Row 1: Horizontal connectors */}
        <line
          x1={NODES.input.x + NODE_SIZE/2 + 2}
          y1={ROW1_Y}
          x2={NODES.cache.x - NODE_SIZE/2 - 8}
          y2={ROW1_Y}
          stroke={getConnectorColor(conn(inputStatus, cacheState === 'idle' ? 'idle' : 'completed'))}
          strokeWidth={2}
        />
        <line
          x1={NODES.cache.x + NODE_SIZE/2 + 8}
          y1={ROW1_Y}
          x2={NODES.a2a.x - NODE_SIZE/2 - 2}
          y2={ROW1_Y}
          stroke={getConnectorColor(cacheState === 'miss' ? conn('completed' as NodeStatus, a2aStatus) : 'idle')}
          strokeWidth={2}
        />
        <line
          x1={NODES.a2a.x + NODE_SIZE/2 + 2}
          y1={ROW1_Y}
          x2={NODES.analyzer.x - NODE_SIZE/2 - 10}
          y2={ROW1_Y}
          stroke={getConnectorColor(conn(a2aStatus, analyzerStatus))}
          strokeWidth={2}
        />
        <line
          x1={NODES.analyzer.x + NODE_SIZE/2 + 2}
          y1={ROW1_Y}
          x2={NODES.critic.x - NODE_SIZE/2 - 2}
          y2={ROW1_Y}
          stroke={getConnectorColor(conn(analyzerStatus, criticStatus))}
          strokeWidth={2}
        />
        <line
          x1={NODES.critic.x + NODE_SIZE/2 + 2}
          y1={ROW1_Y}
          x2={NODES.editor.x - NODE_SIZE/2 - 2}
          y2={ROW1_Y}
          stroke={getConnectorColor(conn(criticStatus, editorStatus))}
          strokeWidth={2}
        />
        <line
          x1={NODES.editor.x + NODE_SIZE/2 + 10}
          y1={ROW1_Y}
          x2={NODES.output.x - NODE_SIZE/2 - 2}
          y2={ROW1_Y}
          stroke={getConnectorColor(conn(editorStatus, outputStatus))}
          strokeWidth={2}
        />

        {/* Input to Exchange vertical connector */}
        <line
          x1={NODES.input.x}
          y1={NODES.input.y + NODE_SIZE/2 + 2}
          x2={NODES.exchange.x}
          y2={NODES.exchange.y - NODE_SIZE/2 - 2}
          stroke={getConnectorColor(conn(inputStatus, exchangeStatus))}
          strokeWidth={2}
        />

        {/* A2A to Researcher elbow connector */}
        <path
          d={`M ${NODES.a2a.x} ${NODES.a2a.y + NODE_SIZE/2 + 2}
              L ${NODES.a2a.x} ${ROW3_Y}
              L ${NODES.researcher.x + NODE_SIZE/2 + 2} ${ROW3_Y}`}
          stroke={getConnectorColor(conn(a2aStatus, researcherStatus))}
          strokeWidth={2}
          fill="none"
        />

        {/* Researcher to MCP Servers connector */}
        <line
          x1={NODES.researcher.x + NODE_SIZE/2 + 2}
          y1={ROW3_Y}
          x2={MCP_SERVERS[0].x - MCP_SIZE/2 - 10}
          y2={ROW3_Y}
          stroke={getConnectorColor(researcherStatus)}
          strokeWidth={2}
        />

        {/* Vertical connectors from Agents to LLMs */}
        {LLM_PROVIDERS.map((llm, i) => (
          <line
            key={llm.name}
            x1={llm.x}
            y1={ROW1_Y + NODE_SIZE/2 + 8}
            x2={llm.x}
            y2={ROW2_Y - LLM_HEIGHT/2 - 2}
            stroke={getConnectorColor(llmStatus)}
            strokeWidth={2}
          />
        ))}

        {/* === GROUP BOXES === */}

        {/* Agents group box */}
        <GroupBox
          x={NODES.analyzer.x - NODE_SIZE/2 - 8}
          y={ROW1_Y - NODE_SIZE/2 - 12}
          width={NODES.editor.x - NODES.analyzer.x + NODE_SIZE + 16}
          height={NODE_SIZE + 35}
        />

        {/* LLM Providers group box */}
        <GroupBox
          x={LLM_PROVIDERS[0].x - LLM_WIDTH/2 - 8}
          y={ROW2_Y - LLM_HEIGHT/2 - 8}
          width={LLM_PROVIDERS[2].x - LLM_PROVIDERS[0].x + LLM_WIDTH + 16}
          height={LLM_HEIGHT + 16}
        />

        {/* MCP Servers group box */}
        <GroupBox
          x={MCP_SERVERS[0].x - MCP_SIZE/2 - 8}
          y={ROW3_Y - MCP_SIZE/2 - 8}
          width={MCP_SERVERS[5].x - MCP_SERVERS[0].x + MCP_SIZE + 16}
          height={MCP_SIZE + 16}
        />

        {/* === NODES === */}

        {/* Row 1: Main flow */}
        <SVGNode x={NODES.input.x} y={NODES.input.y} icon={User} label="User Input" status={inputStatus} />
        <SVGNode x={NODES.cache.x} y={NODES.cache.y} icon={Database} label="Cache" status={cacheState === 'idle' ? 'idle' : 'completed'} isDiamond cacheState={cacheState} />
        <SVGNode x={NODES.a2a.x} y={NODES.a2a.y} icon={Network} label="A2A Client" status={a2aStatus} />
        <SVGNode x={NODES.analyzer.x} y={NODES.analyzer.y} icon={Brain} label="Analyzer" status={analyzerStatus} />
        <SVGNode x={NODES.critic.x} y={NODES.critic.y} icon={MessageSquare} label="Critic" status={criticStatus} />
        <SVGNode x={NODES.editor.x} y={NODES.editor.y} icon={Edit3} label="Editor" status={editorStatus} />
        <SVGNode x={NODES.output.x} y={NODES.output.y} icon={FileOutput} label="Output" status={outputStatus} />

        {/* Row 2: Exchange + LLM Providers */}
        <SVGNode x={NODES.exchange.x} y={NODES.exchange.y} icon={GitBranch} label="Exchange" status={exchangeStatus} />

        {LLM_PROVIDERS.map((llm) => (
          <LLMProvider
            key={llm.name}
            x={llm.x}
            y={ROW2_Y}
            name={llm.name}
            status={llmStatus}
          />
        ))}

        {/* Row 3: Researcher + MCP Servers */}
        <SVGNode x={NODES.researcher.x} y={NODES.researcher.y} icon={Search} label="Researcher" status={researcherStatus} />

        {MCP_SERVERS.map((mcp) => (
          <MCPServer
            key={mcp.id}
            x={mcp.x}
            y={ROW3_Y}
            label={mcp.label}
            status={mcpStatus[mcp.id as keyof MCPStatus] || 'idle'}
          />
        ))}
      </svg>
    </div>
  )
}

export default ProcessFlow
