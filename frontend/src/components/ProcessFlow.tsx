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
  stockSelected?: boolean
  isSearching?: boolean
}

// === CONSTANTS ===

// Node sizing
const NODE_SIZE = 44
const ICON_SIZE = 14
const MCP_SIZE = 36
const MCP_ICON_SIZE = 14
const LLM_WIDTH = 52
const LLM_HEIGHT = 24

// Spacing (fix #5: reduced from 90)
const GAP = 72
const CONNECTOR_PAD = 2  // fix #2: single source of truth
const GROUP_PAD = 8      // fix #7: consistent group box padding

// Row Y positions (uniform 70px gaps)
const ROW_GAP = 70
const ROW1_Y = 28                  // nudged down for stroke headroom
const ROW2_Y = ROW1_Y + ROW_GAP   // 98
const ROW3_Y = ROW2_Y + ROW_GAP   // 168
const BYPASS_Y = 8                 // safe positive Y, never clipped

// Centering: flow occupies 75% evenly
const SVG_WIDTH = 560
const NODE_COUNT = 7
const FLOW_WIDTH = GAP * (NODE_COUNT - 1) + NODE_SIZE  // accounts for node width
const FLOW_START_X = (SVG_WIDTH - FLOW_WIDTH) / 2

// Node X positions (centered)
const NODES = {
  input: { x: FLOW_START_X, y: ROW1_Y },
  cache: { x: FLOW_START_X + GAP, y: ROW1_Y },
  a2a: { x: FLOW_START_X + GAP * 2, y: ROW1_Y },
  analyzer: { x: FLOW_START_X + GAP * 3, y: ROW1_Y },
  critic: { x: FLOW_START_X + GAP * 4, y: ROW1_Y },
  editor: { x: FLOW_START_X + GAP * 5, y: ROW1_Y },
  output: { x: FLOW_START_X + GAP * 6, y: ROW1_Y },
  exchange: { x: FLOW_START_X, y: ROW2_Y },
  researcher: { x: FLOW_START_X + GAP * 2, y: ROW3_Y },
}

// MCP Server positions
const MCP_START_X = NODES.researcher.x + NODE_SIZE / 2 + 40
const MCP_GAP = 44
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
  { id: 'groq', name: 'Groq', x: AGENTS_CENTER_X - 56 },
  { id: 'gemini', name: 'Gemini', x: AGENTS_CENTER_X },
  { id: 'openrouter', name: 'OpenRouter', x: AGENTS_CENTER_X + 56 },
]

// Group box calculations (fix #7: use GROUP_PAD)
const AGENTS_GROUP = {
  x: NODES.analyzer.x - NODE_SIZE / 2 - GROUP_PAD,
  y: ROW1_Y - NODE_SIZE / 2 - GROUP_PAD,
  width: NODES.editor.x - NODES.analyzer.x + NODE_SIZE + GROUP_PAD * 2,
  height: NODE_SIZE + GROUP_PAD * 2,
}

const LLM_GROUP = {
  x: LLM_PROVIDERS[0].x - LLM_WIDTH / 2 - GROUP_PAD,
  y: ROW2_Y - LLM_HEIGHT / 2 - GROUP_PAD,
  width: LLM_PROVIDERS[2].x - LLM_PROVIDERS[0].x + LLM_WIDTH + GROUP_PAD * 2,
  height: LLM_HEIGHT + GROUP_PAD * 2,
}

const MCP_GROUP = {
  x: MCP_SERVERS[0].x - MCP_SIZE / 2 - GROUP_PAD,
  y: ROW3_Y - MCP_SIZE / 2 - GROUP_PAD,
  width: MCP_SERVERS[5].x - MCP_SERVERS[0].x + MCP_SIZE + GROUP_PAD * 2,
  height: MCP_SIZE + GROUP_PAD * 2,
}

// === HELPER FUNCTIONS ===

// Normalize step IDs for comparison (backend sends capitalized, frontend uses lowercase)
function normalizeStep(step: string): string {
  const lower = step.toLowerCase()
  // Map backend names to frontend IDs
  if (lower === 'analyst') return 'analyzer'
  if (lower === 'completed') return 'output'
  return lower
}

function getNodeStatus(
  stepId: string,
  currentStep: string,
  completedSteps: string[],
  cacheHit?: boolean
): NodeStatus {
  const normalizedCurrent = normalizeStep(currentStep)
  const normalizedCompleted = completedSteps.map(normalizeStep)

  if (normalizedCompleted.includes(stepId)) return 'completed'
  if (normalizedCurrent === stepId) return 'executing'
  if (cacheHit && ['researcher', 'analyzer', 'critic', 'editor', 'a2a_client'].includes(stepId)) {
    return 'skipped'
  }
  return 'idle'
}

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
  // Fix #1: userSpaceOnUse with smaller 5x5 geometry
  return (
    <defs>
      <marker id="arrow-idle" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,0 L0,5 L5,2.5 z" fill="var(--pf-connector-idle)" />
      </marker>
      <marker id="arrow-executing" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,0 L0,5 L5,2.5 z" fill="var(--pf-connector-executing)" />
      </marker>
      <marker id="arrow-completed" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,0 L0,5 L5,2.5 z" fill="var(--pf-connector-completed)" />
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
  const opacity = status === 'idle' && !cacheState ? 0.5 : status === 'skipped' ? 0.4 : 1

  // Fix #8: stroke hierarchy - agents=2.5, infrastructure=2
  const strokeWidth = isAgent ? 2.5 : 2

  return (
    <g opacity={opacity}>
      <rect
        x={x - NODE_SIZE / 2}
        y={y - NODE_SIZE / 2}
        width={NODE_SIZE}
        height={NODE_SIZE}
        rx={isDiamond ? 4 : 8}
        strokeWidth={strokeWidth}
        className={cn(nodeClass, isExecuting && 'pf-pulse')}
        transform={isDiamond ? `rotate(45 ${x} ${y})` : undefined}
      />

      {/* Fix #3: icon at y - NODE_SIZE/2 + 9 */}
      <foreignObject
        x={x - ICON_SIZE / 2}
        y={y - NODE_SIZE / 2 + 9}
        width={ICON_SIZE}
        height={ICON_SIZE}
      >
        <div className="flex items-center justify-center w-full h-full">
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          ) : (
            <Icon className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      </foreignObject>

      {/* Fix #3: label at y + NODE_SIZE/2 - 7, text-[8px] */}
      <text
        x={x}
        y={y + NODE_SIZE / 2 - 7}
        textAnchor="middle"
        className={cn('text-[8px] font-medium', getTextClass(status))}
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
  // Opacity rules: full when executing, medium when completed, dim when idle
  const opacity = status === 'executing' ? 1 : status === 'completed' ? 0.6 : 0.3
  const isExecuting = status === 'executing'

  return (
    <g opacity={opacity}>
      <rect
        x={x - MCP_SIZE / 2}
        y={y - MCP_SIZE / 2}
        width={MCP_SIZE}
        height={MCP_SIZE}
        rx={4}
        strokeWidth={1.2}
        className={cn(
          'pf-node',
          isExecuting ? 'pf-node-executing pf-pulse' : status === 'completed' ? 'pf-node-completed' : 'pf-node-idle'
        )}
      />

      {/* Show spinner when executing, server icon otherwise */}
      <foreignObject
        x={x - MCP_ICON_SIZE / 2}
        y={y - MCP_SIZE / 2 + 6}
        width={MCP_ICON_SIZE}
        height={MCP_ICON_SIZE}
      >
        <div className="flex items-center justify-center w-full h-full">
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          ) : (
            <Server className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      </foreignObject>

      {/* Fix #4: text-[7px] */}
      <text
        x={x}
        y={y + MCP_SIZE / 2 - 5}
        textAnchor="middle"
        className="text-[7px] font-medium pf-text-mcp"
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

function GroupBox({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
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
  strokeWidth = 1.4,  // Fix #8: default arrow stroke
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  status: NodeStatus
  strokeWidth?: number
}) {
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
  strokeWidth = 1.4,
  opacity = 1,
  strokeDasharray,
  showArrow = true,
}: {
  d: string
  status: NodeStatus
  strokeWidth?: number
  opacity?: number
  strokeDasharray?: string
  showArrow?: boolean
}) {
  return (
    <path
      d={d}
      strokeWidth={strokeWidth}
      fill="none"
      opacity={opacity}
      strokeDasharray={strokeDasharray}
      markerEnd={showArrow ? `url(#arrow-${status})` : undefined}
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
  stockSelected = false,
  isSearching = false,
}: ProcessFlowProps) {
  // Input & Exchange status based on search/selection state
  const inputStatus: NodeStatus = stockSelected
    ? 'completed'
    : getNodeStatus('input', currentStep, completedSteps, cacheHit)

  // Exchange: blinks while searching, solid green when selected
  const exchangeStatus: NodeStatus = stockSelected
    ? 'completed'
    : isSearching
      ? 'executing'
      : 'idle'

  const analyzerStatus = getNodeStatus('analyzer', currentStep, completedSteps, cacheHit)
  const criticStatus = getNodeStatus('critic', currentStep, completedSteps, cacheHit)
  const editorStatus = getNodeStatus('editor', currentStep, completedSteps, cacheHit)
  const outputStatus = getNodeStatus('output', currentStep, completedSteps, cacheHit)
  const researcherStatus = getNodeStatus('researcher', currentStep, completedSteps, cacheHit)

  // A2A highlights when researcher is active (flow: Cache → A2A → Researcher)
  const a2aStatus: NodeStatus = researcherStatus === 'executing'
    ? 'executing'
    : researcherStatus === 'completed'
      ? 'completed'
      : 'idle'

  // Derive MCP status from researcher - all MCPs execute together
  const derivedMcpStatus = (mcpId: string): NodeStatus => {
    if (researcherStatus === 'executing') return 'executing'
    if (researcherStatus === 'completed') return 'completed'
    return mcpStatus[mcpId as keyof MCPStatus] || 'idle'
  }

  const cacheState: CacheState =
    currentStep === 'cache' ? 'checking' :
    completedSteps.includes('cache') ? (cacheHit ? 'hit' : 'miss') :
    'idle'

  const conn = (from: NodeStatus, to: NodeStatus): NodeStatus =>
    from === 'completed' && to !== 'idle' ? 'completed' :
    from === 'executing' ? 'executing' : 'idle'

  const bypassStatus: NodeStatus = cacheHit && completedSteps.includes('cache') ? 'completed' : 'idle'

  const llmActive = ['analyzer', 'critic', 'editor'].some(s =>
    currentStep === s || completedSteps.includes(s)
  )
  const llmArrowStatus: NodeStatus = ['analyzer', 'critic', 'editor'].some(s => currentStep === s)
    ? 'executing'
    : llmActive ? 'completed' : 'idle'

  // Fix #2: Helper for connector endpoints
  const nodeRight = (n: { x: number }) => n.x + NODE_SIZE / 2 + CONNECTOR_PAD
  const nodeLeft = (n: { x: number }) => n.x - NODE_SIZE / 2 - CONNECTOR_PAD
  const nodeBottom = (n: { y: number }) => n.y + NODE_SIZE / 2 + CONNECTOR_PAD
  const nodeTop = (n: { y: number }) => n.y - NODE_SIZE / 2 - CONNECTOR_PAD

  return (
    <div className="flex justify-center">
      <div className="w-[75%] flex justify-center">
        <svg
          viewBox="0 0 560 240"
          preserveAspectRatio="xMidYMin meet"
          className="w-full max-w-[700px]"
        >
          <ArrowMarkers />

          {/* === CONNECTORS === */}

          {/* Cache bypass - only show arrow when completed (avoids marker clipping when idle) */}
          <ArrowPath
            d={`M ${NODES.cache.x} ${nodeTop(NODES.cache)}
                L ${NODES.cache.x} ${BYPASS_Y}
                L ${NODES.output.x} ${BYPASS_Y}
                L ${NODES.output.x} ${nodeTop(NODES.output)}`}
            status={bypassStatus}
            strokeWidth={1}
            opacity={0.25}
            strokeDasharray="2 3"
            showArrow={bypassStatus === 'completed'}
          />

          {/* Main flow: Input → Cache → A2A → [Agents] → Output */}
          <Arrow
            x1={nodeRight(NODES.input)}
            y1={ROW1_Y}
            x2={nodeLeft(NODES.cache)}
            y2={ROW1_Y}
            status={conn(inputStatus, cacheState === 'idle' ? 'idle' : 'completed')}
          />
          <Arrow
            x1={nodeRight(NODES.cache)}
            y1={ROW1_Y}
            x2={nodeLeft(NODES.a2a)}
            y2={ROW1_Y}
            status={cacheState === 'miss' ? conn('completed' as NodeStatus, a2aStatus) : 'idle'}
          />
          <Arrow
            x1={nodeRight(NODES.a2a)}
            y1={ROW1_Y}
            x2={AGENTS_GROUP.x - CONNECTOR_PAD}
            y2={ROW1_Y}
            status={conn(a2aStatus, analyzerStatus)}
          />
          <Arrow
            x1={nodeRight(NODES.analyzer)}
            y1={ROW1_Y}
            x2={nodeLeft(NODES.critic)}
            y2={ROW1_Y}
            status={conn(analyzerStatus, criticStatus)}
          />
          <Arrow
            x1={nodeRight(NODES.critic)}
            y1={ROW1_Y}
            x2={nodeLeft(NODES.editor)}
            y2={ROW1_Y}
            status={conn(criticStatus, editorStatus)}
          />
          <Arrow
            x1={AGENTS_GROUP.x + AGENTS_GROUP.width + CONNECTOR_PAD}
            y1={ROW1_Y}
            x2={nodeLeft(NODES.output)}
            y2={ROW1_Y}
            status={conn(editorStatus, outputStatus)}
          />

          {/* Input → Exchange */}
          <Arrow
            x1={NODES.input.x}
            y1={nodeBottom(NODES.input)}
            x2={NODES.exchange.x}
            y2={nodeTop(NODES.exchange)}
            status={conn(inputStatus, exchangeStatus)}
          />

          {/* A2A → Researcher (Fix #8: strokeWidth 1.2) */}
          <Arrow
            x1={NODES.a2a.x}
            y1={nodeBottom(NODES.a2a)}
            x2={NODES.researcher.x}
            y2={nodeTop(NODES.researcher)}
            status={conn(a2aStatus, researcherStatus)}
            strokeWidth={1.2}
          />

          {/* Researcher → MCP group (strengthened for visual gravity) */}
          <Arrow
            x1={nodeRight(NODES.researcher)}
            y1={ROW3_Y}
            x2={MCP_GROUP.x - CONNECTOR_PAD}
            y2={ROW3_Y}
            status={researcherStatus}
            strokeWidth={1.6}
          />

          {/* Agents → LLM group */}
          <Arrow
            x1={AGENTS_CENTER_X}
            y1={AGENTS_GROUP.y + AGENTS_GROUP.height + CONNECTOR_PAD}
            x2={AGENTS_CENTER_X}
            y2={LLM_GROUP.y - CONNECTOR_PAD}
            status={llmArrowStatus}
          />

          {/* === GROUP BOXES === */}

          <GroupBox {...AGENTS_GROUP} />
          <GroupBox {...LLM_GROUP} />
          <GroupBox {...MCP_GROUP} />

          {/* === NODES === */}

          {/* Tier-2: Infrastructure */}
          <SVGNode x={NODES.input.x} y={NODES.input.y} icon={User} label="Input" status={inputStatus} />
          <SVGNode x={NODES.cache.x} y={NODES.cache.y} icon={Database} label="Cache" status={cacheState === 'idle' ? 'idle' : 'completed'} isDiamond cacheState={cacheState} />
          <SVGNode x={NODES.a2a.x} y={NODES.a2a.y} icon={Network} label="A2A" status={a2aStatus} />
          <SVGNode x={NODES.output.x} y={NODES.output.y} icon={FileOutput} label="Output" status={outputStatus} />
          <SVGNode x={NODES.exchange.x} y={NODES.exchange.y} icon={GitBranch} label="Exchange" status={exchangeStatus} />

          {/* Tier-1: Agents (isAgent=true) */}
          <SVGNode x={NODES.analyzer.x} y={NODES.analyzer.y} icon={Brain} label="Analyzer" status={analyzerStatus} isAgent />
          <SVGNode x={NODES.critic.x} y={NODES.critic.y} icon={MessageSquare} label="Critic" status={criticStatus} isAgent />
          <SVGNode x={NODES.editor.x} y={NODES.editor.y} icon={Edit3} label="Editor" status={editorStatus} isAgent />
          <SVGNode x={NODES.researcher.x} y={NODES.researcher.y} icon={Search} label="Research" status={researcherStatus} isAgent />

          {/* Tier-3: LLM Providers */}
          {LLM_PROVIDERS.map((llm) => (
            <LLMProvider
              key={llm.id}
              x={llm.x}
              y={ROW2_Y}
              name={llm.name}
              isSelected={llmProvider?.toLowerCase() === llm.id}
            />
          ))}

          {/* Tier-3: MCP Servers */}
          {MCP_SERVERS.map((mcp) => (
            <MCPServer
              key={mcp.id}
              x={mcp.x}
              y={ROW3_Y}
              label={mcp.label}
              status={derivedMcpStatus(mcp.id)}
            />
          ))}
        </svg>
      </div>
      <div className="w-[25%]" />
    </div>
  )
}

export default ProcessFlow
