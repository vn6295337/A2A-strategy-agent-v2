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

// === CONSTANTS (E.8 - reduced sizes) ===

const NODE_SIZE = 44
const MCP_SIZE = 38
const LLM_WIDTH = 52
const LLM_HEIGHT = 24
const ICON_SIZE = 12
const MCP_ICON_SIZE = 12
const GAP = 80

// Row Y positions
const ROW1_Y = 60
const ROW2_Y = 140
const ROW3_Y = 210

// Node X positions (uniform gap)
const NODES = {
  input: { x: 45, y: ROW1_Y },
  cache: { x: 45 + GAP, y: ROW1_Y },
  a2a: { x: 45 + GAP * 2, y: ROW1_Y },
  analyzer: { x: 45 + GAP * 3, y: ROW1_Y },
  critic: { x: 45 + GAP * 4, y: ROW1_Y },
  editor: { x: 45 + GAP * 5, y: ROW1_Y },
  output: { x: 45 + GAP * 6, y: ROW1_Y },
  exchange: { x: 45, y: ROW2_Y },
  researcher: { x: 45 + GAP * 2, y: ROW3_Y },
}

// MCP Server positions
const MCP_START_X = NODES.researcher.x + NODE_SIZE / 2 + 50
const MCP_GAP = 48
const MCP_SERVERS = [
  { id: 'financials', label: 'Fin', x: MCP_START_X },
  { id: 'valuation', label: 'Val', x: MCP_START_X + MCP_GAP },
  { id: 'volatility', label: 'Vol', x: MCP_START_X + MCP_GAP * 2 },
  { id: 'macro', label: 'Mac', x: MCP_START_X + MCP_GAP * 3 },
  { id: 'news', label: 'News', x: MCP_START_X + MCP_GAP * 4 },
  { id: 'sentiment', label: 'Sent', x: MCP_START_X + MCP_GAP * 5 },
]

// LLM Provider positions
const AGENTS_CENTER_X = (NODES.analyzer.x + NODES.editor.x) / 2
const LLM_PROVIDERS = [
  { id: 'groq', name: 'Groq', x: AGENTS_CENTER_X - 60 },
  { id: 'gemini', name: 'Gemini', x: AGENTS_CENTER_X },
  { id: 'openrouter', name: 'OpenRouter', x: AGENTS_CENTER_X + 60 },
]

// Group box calculations
const AGENTS_GROUP = {
  x: NODES.analyzer.x - NODE_SIZE / 2 - 8,
  y: ROW1_Y - NODE_SIZE / 2 - 8,
  width: NODES.editor.x - NODES.analyzer.x + NODE_SIZE + 16,
  height: NODE_SIZE + 16,
}

const LLM_GROUP = {
  x: LLM_PROVIDERS[0].x - LLM_WIDTH / 2 - 8,
  y: ROW2_Y - LLM_HEIGHT / 2 - 8,
  width: LLM_PROVIDERS[2].x - LLM_PROVIDERS[0].x + LLM_WIDTH + 16,
  height: LLM_HEIGHT + 16,
}

const MCP_GROUP = {
  x: MCP_SERVERS[0].x - MCP_SIZE / 2 - 8,
  y: ROW3_Y - MCP_SIZE / 2 - 8,
  width: MCP_SERVERS[5].x - MCP_SERVERS[0].x + MCP_SIZE + 16,
  height: MCP_SIZE + 16,
}

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

// CSS class helpers
function getNodeClass(status: NodeStatus, isAgent: boolean = false): string {
  const base = isAgent ? 'pf-node pf-agent' : 'pf-node'
  return `${base} pf-node-${status}`
}

function getCacheClass(state: CacheState): string {
  if (state === 'idle') return 'pf-node pf-node-idle'
  return `pf-node pf-cache-${state}`
}

function getConnectorClass(status: NodeStatus): string {
  return `pf-connector pf-connector-${status}`
}

function getTextClass(status: NodeStatus): string {
  return status === 'idle' || status === 'skipped' ? 'pf-text-idle' : 'pf-text-active'
}

// === SVG COMPONENTS ===

function ArrowMarkers() {
  return (
    <defs>
      {/* Markers at size 8 (E.8) */}
      <marker id="arrow-idle" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L8,3 z" fill="var(--pf-connector-idle)" />
      </marker>
      <marker id="arrow-executing" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L8,3 z" fill="var(--pf-connector-executing)" />
      </marker>
      <marker id="arrow-completed" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L8,3 z" fill="var(--pf-connector-completed)" />
      </marker>
    </defs>
  )
}

function SVGNode({
  x,
  y,
  icon: Icon,
  label,
  status,
  isDiamond = false,
  cacheState,
  isAgent = false,
}: {
  x: number
  y: number
  icon: React.ElementType
  label: string
  status: NodeStatus
  isDiamond?: boolean
  cacheState?: CacheState
  isAgent?: boolean
}) {
  const nodeClass = cacheState ? getCacheClass(cacheState) : getNodeClass(status, isAgent)
  const isExecuting = status === 'executing' || cacheState === 'checking'

  // F.10 - Only pulse when executing, no other animations
  const opacity = status === 'idle' && !cacheState ? 0.5 : status === 'skipped' ? 0.4 : 1

  return (
    <g opacity={opacity}>
      <rect
        x={x - NODE_SIZE / 2}
        y={y - NODE_SIZE / 2}
        width={NODE_SIZE}
        height={NODE_SIZE}
        rx={isDiamond ? 4 : 8}
        strokeWidth={isAgent ? 2.5 : 2}
        className={cn(nodeClass, isExecuting && 'pf-pulse')}
        transform={isDiamond ? `rotate(45 ${x} ${y})` : undefined}
      />

      <foreignObject
        x={x - ICON_SIZE / 2}
        y={y - NODE_SIZE / 2 + 8}
        width={ICON_SIZE}
        height={ICON_SIZE}
      >
        <div className="flex items-center justify-center w-full h-full">
          {isExecuting ? (
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          ) : (
            <Icon className="w-3 h-3 text-white" />
          )}
        </div>
      </foreignObject>

      <text
        x={x}
        y={y + NODE_SIZE / 2 - 6}
        textAnchor="middle"
        className={cn('text-[6.5px] font-medium', getTextClass(status))}
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
  // D.7 - MCP opacity rules: executing=1, completed=0.6, idle=0.3
  // F.10 - No glow on MCPs
  const opacity = status === 'executing' ? 1 : status === 'completed' ? 0.6 : 0.3

  return (
    <g opacity={opacity}>
      <rect
        x={x - MCP_SIZE / 2}
        y={y - MCP_SIZE / 2}
        width={MCP_SIZE}
        height={MCP_SIZE}
        rx={4}
        strokeWidth={1}
        className="pf-node pf-node-idle"
      />

      <foreignObject
        x={x - MCP_ICON_SIZE / 2}
        y={y - MCP_SIZE / 2 + 6}
        width={MCP_ICON_SIZE}
        height={MCP_ICON_SIZE}
      >
        <div className="flex items-center justify-center w-full h-full">
          <Server className="w-3 h-3 text-white" />
        </div>
      </foreignObject>

      <text
        x={x}
        y={y + MCP_SIZE / 2 - 5}
        textAnchor="middle"
        className="text-[6px] font-medium pf-text-mcp"
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
  isSelected,
}: {
  x: number
  y: number
  name: string
  isSelected: boolean
}) {
  // C.6 - Selected LLM: full opacity, others heavily faded
  // F.10 - No glow on LLMs
  const opacity = isSelected ? 1 : 0.25

  return (
    <g opacity={opacity} transform={isSelected ? `scale(1.05)` : undefined} style={{ transformOrigin: `${x}px ${y}px` }}>
      <rect
        x={x - LLM_WIDTH / 2}
        y={y - LLM_HEIGHT / 2}
        width={LLM_WIDTH}
        height={LLM_HEIGHT}
        rx={4}
        strokeWidth={1}
        className={isSelected ? 'pf-llm pf-llm-completed' : 'pf-llm pf-llm-idle'}
      />

      <text
        x={x}
        y={y + 3}
        textAnchor="middle"
        className={cn('text-[8px] font-medium', isSelected ? 'pf-llm-text-completed' : 'pf-llm-text-idle')}
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
  // G.11 - Dashed, low opacity (~0.35), no background fill
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={8}
      fill="none"
      stroke="var(--pf-group-stroke)"
      strokeWidth={1}
      strokeDasharray="4 3"
      opacity={0.35}
    />
  )
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  status,
  strokeWidth = 1.5,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  status: NodeStatus
  strokeWidth?: number
}) {
  // F.10 - No arrow animation
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      strokeWidth={strokeWidth}
      markerEnd={`url(#arrow-${status})`}
      className={getConnectorClass(status)}
    />
  )
}

function ArrowPath({
  d,
  status,
  strokeWidth = 1.5,
}: {
  d: string
  status: NodeStatus
  strokeWidth?: number
}) {
  return (
    <path
      d={d}
      strokeWidth={strokeWidth}
      fill="none"
      markerEnd={`url(#arrow-${status})`}
      className={getConnectorClass(status)}
    />
  )
}

// === MAIN COMPONENT ===

export function ProcessFlow({
  currentStep,
  completedSteps,
  mcpStatus,
  llmProvider = 'groq',
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

  // Connector status helper
  const conn = (from: NodeStatus, to: NodeStatus): NodeStatus =>
    from === 'completed' && to !== 'idle' ? 'completed' :
    from === 'executing' ? 'executing' : 'idle'

  // Bypass connector status (for cache hit path)
  const bypassStatus: NodeStatus = cacheHit && completedSteps.includes('cache') ? 'completed' : 'idle'

  // LLM status for the arrow from agents to LLM group
  const llmActive = ['analyzer', 'critic', 'editor'].some(s =>
    currentStep === s || completedSteps.includes(s)
  )
  const llmArrowStatus: NodeStatus = ['analyzer', 'critic', 'editor'].some(s => currentStep === s)
    ? 'executing'
    : llmActive ? 'completed' : 'idle'

  return (
    // H.12 - Hard-limit to 75% width
    <div className="flex">
      <div className="w-[75%] p-4 overflow-x-auto">
        <svg
          viewBox="0 0 620 270"
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minHeight: '270px' }}
        >
          <ArrowMarkers />

          {/* === CONNECTORS (B.3 - correct flow only) === */}

          {/* Cache bypass elbow (above Row 1) */}
          <ArrowPath
            d={`M ${NODES.cache.x} ${NODES.cache.y - NODE_SIZE/2 - 3}
                L ${NODES.cache.x} 12
                L ${NODES.output.x} 12
                L ${NODES.output.x} ${NODES.output.y - NODE_SIZE/2 - 3}`}
            status={bypassStatus}
          />

          {/* Main flow: Input → Cache → A2A → Analyzer → Critic → Editor → Output */}
          <Arrow
            x1={NODES.input.x + NODE_SIZE/2 + 2}
            y1={ROW1_Y}
            x2={NODES.cache.x - NODE_SIZE/2 - 10}
            y2={ROW1_Y}
            status={conn(inputStatus, cacheState === 'idle' ? 'idle' : 'completed')}
          />
          <Arrow
            x1={NODES.cache.x + NODE_SIZE/2 + 10}
            y1={ROW1_Y}
            x2={NODES.a2a.x - NODE_SIZE/2 - 10}
            y2={ROW1_Y}
            status={cacheState === 'miss' ? conn('completed' as NodeStatus, a2aStatus) : 'idle'}
          />
          <Arrow
            x1={NODES.a2a.x + NODE_SIZE/2 + 2}
            y1={ROW1_Y}
            x2={AGENTS_GROUP.x - 10}
            y2={ROW1_Y}
            status={conn(a2aStatus, analyzerStatus)}
          />
          <Arrow
            x1={NODES.analyzer.x + NODE_SIZE/2 + 2}
            y1={ROW1_Y}
            x2={NODES.critic.x - NODE_SIZE/2 - 10}
            y2={ROW1_Y}
            status={conn(analyzerStatus, criticStatus)}
          />
          <Arrow
            x1={NODES.critic.x + NODE_SIZE/2 + 2}
            y1={ROW1_Y}
            x2={NODES.editor.x - NODE_SIZE/2 - 10}
            y2={ROW1_Y}
            status={conn(criticStatus, editorStatus)}
          />
          <Arrow
            x1={AGENTS_GROUP.x + AGENTS_GROUP.width + 2}
            y1={ROW1_Y}
            x2={NODES.output.x - NODE_SIZE/2 - 10}
            y2={ROW1_Y}
            status={conn(editorStatus, outputStatus)}
          />

          {/* Input → Exchange (down arrow) */}
          <Arrow
            x1={NODES.input.x}
            y1={NODES.input.y + NODE_SIZE/2 + 2}
            x2={NODES.exchange.x}
            y2={NODES.exchange.y - NODE_SIZE/2 - 10}
            status={conn(inputStatus, exchangeStatus)}
          />

          {/* Secondary flow: A2A → Researcher (E.9: strokeWidth 1.2) */}
          <Arrow
            x1={NODES.a2a.x}
            y1={NODES.a2a.y + NODE_SIZE/2 + 2}
            x2={NODES.researcher.x}
            y2={NODES.researcher.y - NODE_SIZE/2 - 10}
            status={conn(a2aStatus, researcherStatus)}
            strokeWidth={1.2}
          />

          {/* Researcher → MCP group (E.9: strokeWidth 2.0) */}
          <Arrow
            x1={NODES.researcher.x + NODE_SIZE/2 + 2}
            y1={ROW3_Y}
            x2={MCP_GROUP.x - 10}
            y2={ROW3_Y}
            status={researcherStatus}
            strokeWidth={2.0}
          />

          {/* Agents → LLM group (C.5) */}
          <Arrow
            x1={AGENTS_CENTER_X}
            y1={AGENTS_GROUP.y + AGENTS_GROUP.height + 2}
            x2={AGENTS_CENTER_X}
            y2={LLM_GROUP.y - 10}
            status={llmArrowStatus}
          />

          {/* === GROUP BOXES (G.11) === */}

          <GroupBox {...AGENTS_GROUP} />
          <GroupBox {...LLM_GROUP} />
          <GroupBox {...MCP_GROUP} />

          {/* === NODES === */}

          {/* Row 1: Main flow - Tier-2 nodes */}
          <SVGNode x={NODES.input.x} y={NODES.input.y} icon={User} label="Input" status={inputStatus} />
          <SVGNode x={NODES.cache.x} y={NODES.cache.y} icon={Database} label="Cache" status={cacheState === 'idle' ? 'idle' : 'completed'} isDiamond cacheState={cacheState} />
          <SVGNode x={NODES.a2a.x} y={NODES.a2a.y} icon={Network} label="A2A" status={a2aStatus} />
          <SVGNode x={NODES.output.x} y={NODES.output.y} icon={FileOutput} label="Output" status={outputStatus} />

          {/* Row 1: Agents group - Tier-1 agents (A.1, A.2) */}
          <SVGNode x={NODES.analyzer.x} y={NODES.analyzer.y} icon={Brain} label="Analyzer" status={analyzerStatus} isAgent />
          <SVGNode x={NODES.critic.x} y={NODES.critic.y} icon={MessageSquare} label="Critic" status={criticStatus} isAgent />
          <SVGNode x={NODES.editor.x} y={NODES.editor.y} icon={Edit3} label="Editor" status={editorStatus} isAgent />

          {/* Row 2: Exchange */}
          <SVGNode x={NODES.exchange.x} y={NODES.exchange.y} icon={GitBranch} label="Exchange" status={exchangeStatus} />

          {/* Row 2: LLM Providers - Tier-3 (C.6) */}
          {LLM_PROVIDERS.map((llm) => (
            <LLMProvider
              key={llm.id}
              x={llm.x}
              y={ROW2_Y}
              name={llm.name}
              isSelected={llmProvider?.toLowerCase() === llm.id}
            />
          ))}

          {/* Row 3: Researcher - Tier-1 agent (A.1) */}
          <SVGNode x={NODES.researcher.x} y={NODES.researcher.y} icon={Search} label="Research" status={researcherStatus} isAgent />

          {/* Row 3: MCP Servers - Tier-3 (D.7) */}
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
      <div className="w-[25%]" />
    </div>
  )
}

export default ProcessFlow
