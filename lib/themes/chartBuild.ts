// Pure SVG builders — ported directly from the prototype

const COLORS = ['#2a5cff','#60a5fa','#34d399','#f59e0b','#f87171','#a78bfa','#fb923c'];
const W = 280, H = 170;

export function buildChartSVG(type: string, data: Record<string, unknown>): string {
  const vals = (data.values as number[]) || [40,65,55,80,45];
  const labels = (data.labels as string[]) || ['A','B','C','D','E'];

  if (type === 'bar' || type === 'column') {
    const max = Math.max(...vals) || 1;
    const n = vals.length, bw = Math.floor((W - 40) / n - 8), gap = Math.floor((W - 40) / n);
    const baseline = H - 25;
    let bars = '', axLabels = '';
    for (let i = 0; i < n; i++) {
      const bh = Math.round((vals[i] / max) * (baseline - 15));
      const x = 20 + i * gap + (gap - bw) / 2;
      bars += `<rect x="${x}" y="${baseline - bh}" width="${bw}" height="${bh}" fill="${COLORS[i % COLORS.length]}" rx="3"/>`;
      bars += `<text x="${x + bw/2}" y="${baseline - bh - 4}" fill="rgba(255,255,255,.8)" font-size="9" text-anchor="middle" font-family="sans-serif">${vals[i]}</text>`;
      axLabels += `<text x="${x + bw/2}" y="${baseline + 12}" fill="rgba(255,255,255,.55)" font-size="8" text-anchor="middle" font-family="sans-serif">${(labels[i]||'').slice(0,8)}</text>`;
    }
    return `<svg width="${W}" height="${H}" style="border-radius:8px"><line x1="18" y1="${baseline}" x2="${W-10}" y2="${baseline}" stroke="rgba(255,255,255,.2)" stroke-width="1"/>${bars}${axLabels}</svg>`;
  }

  if (type === 'line' || type === 'area') {
    const max = Math.max(...vals) || 1, n = vals.length;
    const baseline = H - 25, pad = 25;
    const xStep = (W - pad * 2) / (n - 1 || 1);
    const pts: string[] = [], dots: string[] = [], axLabels: string[] = [];
    for (let i = 0; i < n; i++) {
      const cx = pad + i * xStep;
      const cy = baseline - Math.round((vals[i] / max) * (baseline - 15));
      pts.push(`${cx},${cy}`);
      dots.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${COLORS[0]}"/>`);
      dots.push(`<text x="${cx}" y="${cy-7}" fill="rgba(255,255,255,.8)" font-size="9" text-anchor="middle" font-family="sans-serif">${vals[i]}</text>`);
      axLabels.push(`<text x="${cx}" y="${baseline+12}" fill="rgba(255,255,255,.55)" font-size="8" text-anchor="middle" font-family="sans-serif">${(labels[i]||'').slice(0,8)}</text>`);
    }
    const polyline = `<polyline points="${pts.join(' ')}" fill="none" stroke="${COLORS[0]}" stroke-width="2.5"/>`;
    let area = '';
    if (type === 'area') {
      const fp = pts[0].split(','), lp = pts[pts.length-1].split(',');
      area = `<polygon points="${pts.join(' ')} ${lp[0]},${baseline} ${fp[0]},${baseline}" fill="${COLORS[0]}" opacity=".18"/>`;
    }
    return `<svg width="${W}" height="${H}" style="border-radius:8px"><line x1="18" y1="${baseline}" x2="${W-10}" y2="${baseline}" stroke="rgba(255,255,255,.2)" stroke-width="1"/>${area}${polyline}${dots.join('')}${axLabels.join('')}</svg>`;
  }

  if (type === 'pie' || type === 'donut') {
    const total = vals.reduce((a,b)=>a+b,0) || 1;
    const cx = W/2, cy = H/2, R = Math.min(cx,cy)-18;
    const inner = type === 'donut' ? R * 0.52 : 0;
    let slices = '', legend = '';
    let startAngle = -Math.PI/2;
    for (let i = 0; i < vals.length; i++) {
      const frac = vals[i]/total, endAngle = startAngle + frac * 2 * Math.PI;
      const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
      const x2 = cx + R * Math.cos(endAngle), y2 = cy + R * Math.sin(endAngle);
      const largeArc = frac > 0.5 ? 1 : 0;
      const midAngle = startAngle + frac * Math.PI;
      const lx = cx + (R * 0.68) * Math.cos(midAngle), ly = cy + (R * 0.68) * Math.sin(midAngle);
      const pct = Math.round(frac * 100);
      if (inner > 0) {
        const ix1 = cx + inner * Math.cos(startAngle), iy1 = cy + inner * Math.sin(startAngle);
        const ix2 = cx + inner * Math.cos(endAngle), iy2 = cy + inner * Math.sin(endAngle);
        slices += `<path d="M${ix1} ${iy1} L${x1} ${y1} A${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L${ix2} ${iy2} A${inner} ${inner} 0 ${largeArc} 0 ${ix1} ${iy1} Z" fill="${COLORS[i%COLORS.length]}" opacity=".9"/>`;
      } else {
        slices += `<path d="M${cx} ${cy} L${x1} ${y1} A${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${COLORS[i%COLORS.length]}" opacity=".9"/>`;
      }
      if (frac > 0.05) slices += `<text x="${lx}" y="${ly+4}" fill="white" font-size="9" text-anchor="middle" font-family="sans-serif" font-weight="bold">${pct}%</text>`;
      legend += `<rect x="${W-85}" y="${10+i*16}" width="8" height="8" fill="${COLORS[i%COLORS.length]}" rx="1"/>`;
      legend += `<text x="${W-73}" y="${18+i*16}" fill="rgba(255,255,255,.7)" font-size="8" font-family="sans-serif">${(labels[i]||'').slice(0,9)}</text>`;
      startAngle = endAngle;
    }
    return `<svg width="${W}" height="${H}" style="border-radius:8px">${slices}${legend}</svg>`;
  }

  if (type === 'funnel') {
    const fl = (data.funnelLabels as string[]) || ['Awareness','Interest','Consideration','Intent','Purchase'];
    const n = fl.length;
    let svg = '';
    for (let i = 0; i < n; i++) {
      const tw = W - (i * (W/(n+1)));
      const x1 = (W-tw)/2, x2 = x1+tw;
      const yTop = 10 + i * ((H-20)/n), yBot = yTop + (H-20)/n - 4;
      const nextW = W - ((i+1)*(W/(n+1)));
      const bx1 = (W-nextW)/2;
      svg += `<polygon points="${x1},${yTop} ${x2},${yTop} ${W-bx1},${yBot} ${bx1},${yBot}" fill="${COLORS[i%COLORS.length]}" opacity=".82"/>`;
      svg += `<text x="${W/2}" y="${yTop+(yBot-yTop)/2+4}" fill="white" font-size="9" text-anchor="middle" font-family="sans-serif" font-weight="bold">${fl[i].slice(0,14)}</text>`;
    }
    return `<svg width="${W}" height="${H}" style="border-radius:8px">${svg}</svg>`;
  }

  // fallback bar
  return buildChartSVG('bar', {values:[40,65,55,80,45],labels:['A','B','C','D','E']});
}

export function buildDiagramSVG(type: string, data: Record<string, unknown>): string {
  const DW = 260, DH = 180;

  if (type === 'venn') {
    const labels = (data.vennLabels as string[]) || ['Group A','Overlap','Group B'];
    return `<svg width="${DW}" height="${DH}"><circle cx="95" cy="90" r="72" fill="${COLORS[0]}" opacity=".5"/><circle cx="165" cy="90" r="72" fill="${COLORS[1]}" opacity=".5"/><text x="58" y="94" fill="white" font-size="11" font-weight="bold" font-family="sans-serif">${labels[0].slice(0,9)}</text><text x="117" y="87" fill="white" font-size="9" text-anchor="middle" font-family="sans-serif">${labels[1].slice(0,7)}</text><text x="175" y="94" fill="white" font-size="11" font-weight="bold" font-family="sans-serif">${labels[2].slice(0,9)}</text></svg>`;
  }

  if (type === 'swot') {
    const labels = (data.swotLabels as string[]) || ['Strengths','Weaknesses','Opportunities','Threats'];
    const c2 = ['#16a34a','#dc2626','#2a5cff','#d97706'];
    return `<svg width="${DW}" height="${DH}"><rect x="4" y="4" width="124" height="84" fill="${c2[0]}" rx="5" opacity=".8"/><rect x="132" y="4" width="124" height="84" fill="${c2[1]}" rx="5" opacity=".8"/><rect x="4" y="92" width="124" height="84" fill="${c2[2]}" rx="5" opacity=".8"/><rect x="132" y="92" width="124" height="84" fill="${c2[3]}" rx="5" opacity=".8"/><text x="66" y="50" fill="white" font-size="11" font-weight="bold" text-anchor="middle" font-family="sans-serif">${labels[0].slice(0,11)}</text><text x="194" y="50" fill="white" font-size="11" font-weight="bold" text-anchor="middle" font-family="sans-serif">${labels[1].slice(0,11)}</text><text x="66" y="138" fill="white" font-size="11" font-weight="bold" text-anchor="middle" font-family="sans-serif">${labels[2].slice(0,11)}</text><text x="194" y="138" fill="white" font-size="11" font-weight="bold" text-anchor="middle" font-family="sans-serif">${labels[3].slice(0,11)}</text></svg>`;
  }

  if (type === 'pyramid') {
    const levels = (data.pyramidLevels as string[]) || ['Vision','Strategy','Tactics','Actions'];
    const n = levels.length;
    let svg = '';
    for (let i = 0; i < n; i++) {
      const tw = DW - (i * (DW/(n+0.5)));
      const x1 = (DW-tw)/2, yTop = 10 + i*(DH-20)/n, yBot = yTop + (DH-20)/n - 4;
      const nextTw = DW - ((i+1)*(DW/(n+0.5)));
      const bx1 = (DW-nextTw)/2;
      svg += `<polygon points="${x1},${yTop} ${x1+tw},${yTop} ${bx1+nextTw},${yBot} ${bx1},${yBot}" fill="${COLORS[i%COLORS.length]}" opacity=".82"/>`;
      svg += `<text x="${DW/2}" y="${yTop+(yBot-yTop)/2+4}" fill="white" font-size="9" text-anchor="middle" font-family="sans-serif" font-weight="bold">${levels[i].slice(0,14)}</text>`;
    }
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px">${svg}</svg>`;
  }

  if (type === 'cycle') {
    const steps = (data.cycleSteps as string[]) || ['Plan','Do','Check','Act'];
    const n = steps.length, cx = DW/2, cy = DH/2, R = Math.min(cx,cy)-28;
    let svg = '';
    for (let i = 0; i < n; i++) {
      const angle = (i/n)*2*Math.PI - Math.PI/2;
      const x = cx + R * Math.cos(angle), y = cy + R * Math.sin(angle);
      svg += `<circle cx="${x}" cy="${y}" r="22" fill="${COLORS[i%COLORS.length]}" opacity=".85"/>`;
      svg += `<text x="${x}" y="${y+4}" fill="white" font-size="9" text-anchor="middle" font-family="sans-serif" font-weight="bold">${steps[i].slice(0,6)}</text>`;
      const nextAngle = ((i+1)/n)*2*Math.PI - Math.PI/2;
      const nx = cx + (R-24) * Math.cos(nextAngle), ny = cy + (R-24) * Math.sin(nextAngle);
      const midAngle = ((i+0.5)/n)*2*Math.PI - Math.PI/2;
      const mx = cx + R * Math.cos(midAngle), my = cy + R * Math.sin(midAngle);
      svg += `<path d="M${x+22*Math.cos(nextAngle-angle)} ${y+22*Math.sin(nextAngle-angle)} Q${mx},${my} ${nx},${ny}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.5" marker-end="url(#arr)"/>`;
    }
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px"><defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,.5)"/></marker></defs>${svg}</svg>`;
  }

  if (type === 'timeline') {
    const events = (data.timelineEvents as {label:string,year:string}[]) || [{label:'Start',year:'Q1'},{label:'Mid',year:'Q2'},{label:'End',year:'Q3'}];
    const n = events.length, yLine = DH/2;
    const step = (DW-40)/(n-1||1);
    let svg = `<line x1="20" y1="${yLine}" x2="${DW-20}" y2="${yLine}" stroke="rgba(255,255,255,.3)" stroke-width="2"/>`;
    events.forEach((ev, i) => {
      const x = 20 + i*step;
      svg += `<circle cx="${x}" cy="${yLine}" r="8" fill="${COLORS[i%COLORS.length]}"/>`;
      svg += `<text x="${x}" y="${yLine-14}" fill="rgba(255,255,255,.8)" font-size="8" text-anchor="middle" font-family="sans-serif" font-weight="bold">${(ev.year||'').slice(0,4)}</text>`;
      svg += `<text x="${x}" y="${yLine+22}" fill="rgba(255,255,255,.6)" font-size="8" text-anchor="middle" font-family="sans-serif">${(ev.label||'').slice(0,8)}</text>`;
    });
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px">${svg}</svg>`;
  }

  if (type === 'quadrant') {
    const labels = (data.quadLabels as string[]) || ['Quick Wins','Major Projects','Fill-ins','Thankless'];
    const c2 = ['#16a34a','#2a5cff','#888','#dc2626'];
    let svg = `<line x1="${DW/2}" y1="10" x2="${DW/2}" y2="${DH-10}" stroke="rgba(255,255,255,.3)" stroke-width="1"/>`;
    svg += `<line x1="10" y1="${DH/2}" x2="${DW-10}" y2="${DH/2}" stroke="rgba(255,255,255,.3)" stroke-width="1"/>`;
    const positions = [{x:DW/4,y:DH/4},{x:3*DW/4,y:DH/4},{x:DW/4,y:3*DH/4},{x:3*DW/4,y:3*DH/4}];
    positions.forEach((p, i) => {
      svg += `<text x="${p.x}" y="${p.y}" fill="${c2[i]}" font-size="10" text-anchor="middle" font-family="sans-serif" font-weight="bold">${labels[i].slice(0,11)}</text>`;
    });
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px">${svg}</svg>`;
  }

  if (type === 'mindmap') {
    const center = (data.mmCenter as string) || 'Topic';
    const branches = (data.mmBranches as string[]) || ['Idea 1','Idea 2','Idea 3','Idea 4'];
    const cx = DW/2, cy = DH/2;
    let svg = `<circle cx="${cx}" cy="${cy}" r="32" fill="${COLORS[0]}" opacity=".9"/><text x="${cx}" y="${cy+4}" fill="white" font-size="10" text-anchor="middle" font-family="sans-serif" font-weight="bold">${center.slice(0,8)}</text>`;
    branches.forEach((b, i) => {
      const angle = (i/branches.length)*2*Math.PI - Math.PI/2;
      const bx = cx + 80 * Math.cos(angle), by = cy + 60 * Math.sin(angle);
      svg += `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>`;
      svg += `<circle cx="${bx}" cy="${by}" r="20" fill="${COLORS[(i+1)%COLORS.length]}" opacity=".8"/>`;
      svg += `<text x="${bx}" y="${by+4}" fill="white" font-size="8" text-anchor="middle" font-family="sans-serif">${b.slice(0,7)}</text>`;
    });
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px">${svg}</svg>`;
  }

  if (type === 'comparison') {
    const items = (data.compItems as string[]) || ['Speed','Cost','Quality'];
    const leftVals = (data.compLeft as number[]) || [8,4,7];
    const rightVals = (data.compRight as number[]) || [5,9,8];
    const compLabels = (data.compLabels as string[]) || ['Option A','Option B'];
    let svg = `<text x="${DW*0.25}" y="16" fill="${COLORS[0]}" font-size="10" text-anchor="middle" font-family="sans-serif" font-weight="bold">${compLabels[0].slice(0,9)}</text>`;
    svg += `<text x="${DW*0.75}" y="16" fill="${COLORS[1]}" font-size="10" text-anchor="middle" font-family="sans-serif" font-weight="bold">${compLabels[1].slice(0,9)}</text>`;
    items.forEach((item, i) => {
      const y = 28 + i*26;
      const lw = (leftVals[i]||5)/10*(DW/2-20);
      const rw = (rightVals[i]||5)/10*(DW/2-20);
      svg += `<rect x="${DW/2-lw}" y="${y}" width="${lw}" height="14" fill="${COLORS[0]}" opacity=".75" rx="2"/>`;
      svg += `<rect x="${DW/2}" y="${y}" width="${rw}" height="14" fill="${COLORS[1]}" opacity=".75" rx="2"/>`;
      svg += `<text x="${DW/2}" y="${y+10}" fill="rgba(255,255,255,.7)" font-size="8" text-anchor="middle" font-family="sans-serif">${item.slice(0,8)}</text>`;
    });
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px">${svg}</svg>`;
  }

  if (type === 'target') {
    const rings = (data.targetRings as string[]) || ['Core','Secondary','Awareness'];
    const cx = DW/2, cy = DH/2;
    let svg = '';
    rings.slice().reverse().forEach((r, i) => {
      const radius = 20 + (rings.length-1-i) * 30;
      svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${COLORS[(rings.length-1-i)%COLORS.length]}" opacity="${0.5+i*0.15}"/>`;
      svg += `<text x="${cx}" y="${cy-radius+14}" fill="rgba(255,255,255,.8)" font-size="8" text-anchor="middle" font-family="sans-serif">${r.slice(0,10)}</text>`;
    });
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px">${svg}</svg>`;
  }

  if (type === 'orbit') {
    const center = (data.orbitCenter as string) || 'Core';
    const items = (data.orbitItems as string[]) || ['A','B','C','D'];
    const cx = DW/2, cy = DH/2;
    let svg = `<circle cx="${cx}" cy="${cy}" r="28" fill="${COLORS[0]}" opacity=".9"/><text x="${cx}" y="${cy+4}" fill="white" font-size="10" text-anchor="middle" font-family="sans-serif" font-weight="bold">${center.slice(0,7)}</text>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1"/>`;
    items.forEach((item, i) => {
      const angle = (i/items.length)*2*Math.PI - Math.PI/2;
      const bx = cx + 70*Math.cos(angle), by = cy + 70*Math.sin(angle);
      svg += `<circle cx="${bx}" cy="${by}" r="18" fill="${COLORS[(i+1)%COLORS.length]}" opacity=".8"/>`;
      svg += `<text x="${bx}" y="${by+4}" fill="white" font-size="8" text-anchor="middle" font-family="sans-serif">${item.slice(0,6)}</text>`;
    });
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px">${svg}</svg>`;
  }

  if (type === 'flowchart') {
    const nodes = (data.flowNodes as {label:string,type:string}[]) || [{label:'Start',type:'oval'},{label:'Process',type:'rect'},{label:'Decision',type:'diamond'},{label:'End',type:'oval'}];
    const step = (DW-40)/(nodes.length-1||1);
    let svg = `<line x1="20" y1="${DH/2}" x2="${DW-20}" y2="${DH/2}" stroke="rgba(255,255,255,.2)" stroke-width="1"/>`;
    nodes.forEach((nd, i) => {
      const x = 20 + i*step, cy = DH/2;
      if (nd.type === 'diamond') {
        svg += `<polygon points="${x},${cy-18} ${x+20},${cy} ${x},${cy+18} ${x-20},${cy}" fill="${COLORS[i%COLORS.length]}" opacity=".85"/>`;
      } else if (nd.type === 'oval') {
        svg += `<ellipse cx="${x}" cy="${cy}" rx="22" ry="16" fill="${COLORS[i%COLORS.length]}" opacity=".85"/>`;
      } else {
        svg += `<rect x="${x-18}" y="${cy-14}" width="36" height="28" fill="${COLORS[i%COLORS.length]}" rx="3" opacity=".85"/>`;
      }
      svg += `<text x="${x}" y="${cy+4}" fill="white" font-size="8" text-anchor="middle" font-family="sans-serif" font-weight="bold">${(nd.label||'').slice(0,6)}</text>`;
      svg += `<text x="${x}" y="${cy+26}" fill="rgba(255,255,255,.5)" font-size="7" text-anchor="middle" font-family="sans-serif">${(nd.label||'').slice(0,8)}</text>`;
    });
    return `<svg width="${DW}" height="${DH}" style="border-radius:8px">${svg}</svg>`;
  }

  // funnel fallback for diagrams
  return buildDiagramSVG('venn', {});
}

export function getDefaultChartData(type: string): Record<string, unknown> {
  const defaults: Record<string, unknown> = {
    bar:   {values:[42,68,55,81,47],labels:['Jan','Feb','Mar','Apr','May']},
    column:{values:[42,68,55,81,47],labels:['Jan','Feb','Mar','Apr','May']},
    line:  {values:[30,55,45,70,60,85],labels:['Q1','Q2','Q3','Q4','Q5','Q6']},
    area:  {values:[30,55,45,70,60,85],labels:['Q1','Q2','Q3','Q4','Q5','Q6']},
    pie:   {values:[35,28,22,15],labels:['Product A','Product B','Product C','Other']},
    donut: {values:[40,30,20,10],labels:['Category 1','Category 2','Category 3','Category 4']},
    funnel:{funnelLabels:['Awareness','Interest','Consideration','Intent','Purchase']},
    scatter:{points:[{x:40,y:100},{x:90,y:60},{x:130,y:110},{x:170,y:35}]},
    bubble:{bubbles:[{x:65,y:90,r:26,label:'A'},{x:140,y:60,r:40,label:'B'},{x:205,y:100,r:20,label:'C'}]},
    venn:  {vennLabels:['Group A','Overlap','Group B']},
    swot:  {swotLabels:['Strengths','Weaknesses','Opportunities','Threats']},
    target:{targetRings:['Core Audience','Secondary','Awareness']},
    orbit: {orbitCenter:'Product',orbitItems:['Feature A','Feature B','Feature C','Feature D']},
    pyramid:{pyramidLevels:['Vision','Strategy','Tactics','Actions']},
    cycle: {cycleSteps:['Plan','Do','Check','Act']},
    timeline:{timelineEvents:[{label:'Kickoff',year:'Q1'},{label:'Design',year:'Q2'},{label:'Build',year:'Q3'},{label:'Launch',year:'Q4'}]},
    mindmap:{mmCenter:'Main Topic',mmBranches:['Idea 1','Idea 2','Idea 3','Idea 4','Idea 5']},
    flowchart:{flowNodes:[{label:'Start',type:'oval'},{label:'Process',type:'rect'},{label:'Decision',type:'diamond'},{label:'End',type:'oval'}]},
    quadrant:{quadLabels:['Quick Wins','Major Projects','Fill-ins','Thankless']},
    comparison:{compLabels:['Option A','Option B'],compItems:['Speed','Cost','Quality','Ease'],compLeft:[8,4,7,9],compRight:[5,9,8,4]},
    gantt:{ganttTasks:[{label:'Research',start:0,duration:3},{label:'Design',start:2,duration:4},{label:'Build',start:4,duration:5},{label:'Test',start:7,duration:3},{label:'Launch',start:9,duration:2}]},
    heatmap:{heatRows:['Mon','Tue','Wed','Thu'],heatCols:['9am','11am','1pm','3pm','5pm'],heatVals:[[8,3,6,9,4],[2,7,5,8,3],[6,4,9,2,7],[3,8,4,6,5]]},
    calendar:{calMonth:'June 2026',calDays:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],calHighlights:[5,12,19,26],calStart:6},
  };
  const v = defaults[type] || {values:[40,65,55,80],labels:['A','B','C','D']};
  return JSON.parse(JSON.stringify(v));
}
