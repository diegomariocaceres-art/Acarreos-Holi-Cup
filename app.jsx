const { createClient } = supabase;
const { useState, useEffect } = React;

const SUPABASE_URL = "https://xxbrrtyuqrbypaqioqfq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YnJydHh1cXJieXBhcWlvcWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTY1MzMsImV4cCI6MjA5NTI3MjUzM30.dfVWR8PW52_CyqJUd1bnZCoWhefZNgSOlWo5783akHE";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const POINTS_TABLE = {
  1:200,2:175,3:150,4:130,5:110,6:90,7:75,8:60,9:50,10:40,11:30,12:20,13:10,14:5
};
const FINAL_HANDICAP = {1:6,2:5,3:4,4:3,5:2,6:1};
const PRIZE_SPLIT = {1:0.60,2:0.30,3:0.10};
const ALL_PLAYERS = [
  "El Doctor","Felipao","Gio","Diegolfa","Felipe R","Ñaño","Daniel B",
  "Garbimba Asesina","Pistolas","Juanca","Paisa","Nayibe","Fercho",
  "El Nene","Yerri","Juan Rory","Chapo","Dani B"
];
const trophyColors = ["#FFD700","#C0C0C0","#CD7F32"];
const trophyEmoji  = ["🥇","🥈","🥉"];

function calcTotalPoints(scores) {
  return [...scores].sort((a,b)=>b-a).slice(0,8).reduce((a,b)=>a+b,0);
}

function buildPlayers(fechas) {
  return ALL_PLAYERS.map(name => {
    const scores = fechas.map(f => {
      const pts = f.resultados[name] ?? 0;
      return f.es_playoff ? pts * 2 : pts;
    });
    const paid = fechas.map(f => f.pagos[name] ?? 0);
    const wins = fechas.map(f => f.daily_wins[name] ?? 0);
    const datesPlayed = fechas.filter(f => (f.resultados[name] ?? 0) > 0).length;
    const total = calcTotalPoints(scores);
    return { name, scores, paid, wins, datesPlayed, total };
  });
}

function App() {
  const [fechas, setFechas]             = useState([]);
  const [activeTab, setActiveTab]       = useState("ranking");
  const [showAddDate, setShowAddDate]   = useState(false);
  const [newResults, setNewResults]     = useState({});
  const [newPaid, setNewPaid]           = useState({});
  const [newWinner, setNewWinner]       = useState(null);
  const [newIsPlayoff, setNewIsPlayoff] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [finalScores, setFinalScores]   = useState({});
  const [finalClosed, setFinalClosed]   = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    loadFechas();
    const channel = db
      .channel('fechas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fechas' }, () => loadFechas())
      .subscribe();
    return () => db.removeChannel(channel);
  }, []);

  async function loadFechas() {
    try {
      const { data, error } = await db.from('fechas').select('*').order('id');
      if (error) { setError(error.message); setLoading(false); return; }
      setFechas(data || []);
      setLoading(false);
    } catch(e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function handleAddDate() {
    const resultados = {}, pagos = {}, daily_wins = {};
    ALL_PLAYERS.forEach(p => {
      const pts = parseInt(newResults[p] ?? '0') || 0;
      if (pts > 0) resultados[p] = pts;
      if (newPaid[p]) pagos[p] = 10;
      if (newWinner === p) daily_wins[p] = 10;
    });
    await db.from('fechas').insert({
      nombre: `Fecha ${fechas.length + 1}`,
      es_playoff: newIsPlayoff,
      resultados, pagos, daily_wins
    });
    setNewResults({}); setNewPaid({}); setNewWinner(null);
    setNewIsPlayoff(false); setShowAddDate(false);
  }

  const players = buildPlayers(fechas);
  const ranked = [...players].sort((a,b) => b.total - a.total);
  let pos = 1;
  const withPos = ranked.map((p,i) => {
    if (i > 0 && ranked[i-1].total !== p.total) pos = i + 1;
    return { ...p, pos };
  });
  const pot = players.reduce((s,p) => s + p.paid.reduce((a,b)=>a+b,0), 0);
  const qualified = withPos.filter(p => p.datesPlayed >= 6);
  const finalResults = qualified
    .filter(p => finalScores[p.name] != null && finalScores[p.name] !== "")
    .map((p,i) => {
      const gross = Number(finalScores[p.name]);
      const hcp = FINAL_HANDICAP[i+1] ?? 0;
      return { ...p, gross, hcp, net: gross - hcp };
    }).sort((a,b) => a.net - b.net);
  const prizes = finalClosed ? finalResults.slice(0,3).map((p,i) => ({
    ...p, prize: Math.round(pot * PRIZE_SPLIT[i+1])
  })) : [];

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#c8a84b",fontFamily:"Georgia,serif",gap:16}}>
      <div style={{fontSize:32}}>⛳</div>
      <div style={{fontSize:18}}>Cargando...</div>
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#e87f7f",fontFamily:"Georgia,serif",gap:16,padding:20}}>
      <div style={{fontSize:32}}>⚠️</div>
      <div style={{fontSize:14,textAlign:"center"}}>Error: {error}</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e 0%,#0d2137 50%,#0a1a0f 100%)",fontFamily:"Georgia,serif",color:"#e8dcc8"}}>
      <div style={{background:"linear-gradient(180deg,#1a3a1a 0%,#0d2137 100%)",borderBottom:"3px solid #c8a84b",padding:"32px 20px 20px",textAlign:"center"}}>
        <div style={{fontSize:"13px",letterSpacing:"4px",color:"#c8a84b",marginBottom:"8px"}}>⛳ 2026 ⛳</div>
        <h1 style={{margin:0,fontSize:"clamp(28px,7vw,52px)",fontWeight:"900",color:"#fff",lineHeight:1.1}}>
          ACARREOS<br/><span style={{color:"#c8a84b"}}>HOLI CUP</span>
        </h1>
        <div style={{marginTop:"16px",display:"flex",justifyContent:"center",gap:"24px",flexWrap:"wrap"}}>
          {[
            {label:"Fechas Jugadas",value:fechas.length},
            {label:"Pozo Acumulado",value:`$${pot}`},
            {label:"Clasificados",value:`${qualified.length} / ${ALL_PLAYERS.length}`},
          ].map(s=>(
            <div key={s.label} style={{background:"rgba(200,168,75,0.1)",border:"1px solid rgba(200,168,75,0.3)",borderRadius:"8px",padding:"8px 16px",textAlign:"center"}}>
              <div style={{fontSize:"20px",fontWeight:"bold",color:"#c8a84b"}}>{s.value}</div>
              <div style={{fontSize:"11px",color:"#9aa",letterSpacing:"1px"}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:"12px",display:"inline-flex",alignItems:"center",gap:6,padding:"6px 16px",borderRadius:20,background:"rgba(75,200,120,0.1)",border:"1px solid rgba(75,200,120,0.3)"}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:"#4bc87a",display:"inline-block"}}></span>
          <span style={{fontSize:12,color:"#4bc87a",letterSpacing:2}}>EN VIVO 🔥</span>
        </div>
      </div>

      <div style={{display:"flex",borderBottom:"1px solid rgba(200,168,75,0.2)",background:"rgba(0,0,0,0.3)",overflowX:"auto"}}>
        {[
          {key:"ranking",label:"🏆 Ranking"},
          {key:"historial",label:"📅 Historial"},
          {key:"playoffs",label:"⚔️ Playoffs"},
          {key:"final",label:"🏁 Final"},
          {key:"reglas",label:"📋 Reglas"},
        ].map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{flex:1,minWidth:"70px",padding:"14px 6px",background:"none",border:"none",color:activeTab===t.key?"#c8a84b":"#888",borderBottom:activeTab===t.key?"3px solid #c8a84b":"3px solid transparent",cursor:"pointer",fontFamily:"inherit",fontSize:"11px",letterSpacing:"1px",textTransform:"uppercase",fontWeight:activeTab===t.key?"bold":"normal",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:"16px",maxWidth:"700px",margin:"0 auto"}}>

        {activeTab==="ranking"&&(
          <div>
            <div style={{marginBottom:12,fontSize:11,color:"#667",letterSpacing:1}}>Top 8 puntajes · Playoffs ×2 · Mín. 6 fechas para clasificar</div>
            {withPos.map(player=>{
              const isTop3=player.pos<=3;
              const isExpanded=expandedPlayer===player.name;
              const isQualified=player.datesPlayed>=6;
              return (
                <div key={player.name} onClick={()=>setExpandedPlayer(isExpanded?null:player.name)}
                  style={{marginBottom:"8px",borderRadius:"12px",border:`1px solid ${isTop3?trophyColors[player.pos-1]+"60":"rgba(200,168,75,0.15)"}`,background:isTop3?`linear-gradient(135deg,rgba(${player.pos===1?"255,215,0":player.pos===2?"192,192,192":"205,127,50"},0.12) 0%,rgba(0,0,0,0.4) 100%)`:"rgba(255,255,255,0.04)",cursor:"pointer",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",padding:"14px 16px",gap:"14px"}}>
                    <div style={{width:"36px",textAlign:"center",fontSize:isTop3?"24px":"18px",fontWeight:"900",color:isTop3?trophyColors[player.pos-1]:"#667",flexShrink:0}}>
                      {isTop3?trophyEmoji[player.pos-1]:`#${player.pos}`}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:"700",fontSize:"16px",color:isTop3?trophyColors[player.pos-1]:"#e8dcc8"}}>{player.name}</div>
                      <div style={{fontSize:"11px",color:"#777",marginTop:"2px"}}>
                        {player.datesPlayed} fecha{player.datesPlayed!==1?"s":""} jugada{player.datesPlayed!==1?"s":""}
                        {!isQualified&&player.datesPlayed>0&&<span style={{color:"#c87a4b"}}> · Necesita {6-player.datesPlayed} más</span>}
                        {isQualified&&<span style={{color:"#4bc87a"}}> · ✓ Clasificado</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:"24px",fontWeight:"900",color:isTop3?trophyColors[player.pos-1]:"#c8a84b"}}>{player.total}</div>
                      <div style={{fontSize:"10px",color:"#777",letterSpacing:"1px"}}>PTS</div>
                    </div>
                    <div style={{color:"#555",fontSize:"12px"}}>{isExpanded?"▲":"▼"}</div>
                  </div>
                  {isExpanded&&(
                    <div style={{borderTop:"1px solid rgba(200,168,75,0.15)",padding:"12px 16px",background:"rgba(0,0,0,0.2)"}}>
                      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                        {player.scores.map((pts,di)=>(
                          <div key={di} style={{background:pts>0?"rgba(200,168,75,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${pts>0?"rgba(200,168,75,0.3)":"rgba(255,255,255,0.1)"}`,borderRadius:"8px",padding:"8px 14px",textAlign:"center"}}>
                            <div style={{fontSize:"10px",color:"#888"}}>F{di+1}{fechas[di]?.es_playoff?" ⚔️":""}</div>
                            <div style={{fontSize:"20px",fontWeight:"bold",color:fechas[di]?.es_playoff?"#a87fe8":pts>0?"#c8a84b":"#555"}}>{pts>0?pts:"—"}</div>
                            {player.wins[di]>0&&<div style={{fontSize:"10px",color:"#4bc87a"}}>🏆</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={()=>setShowAddDate(true)} style={{width:"100%",marginTop:"16px",padding:"14px",background:"linear-gradient(135deg,#1a3a1a,#0d2137)",border:"2px dashed rgba(200,168,75,0.4)",borderRadius:"12px",color:"#c8a84b",fontSize:"14px",letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>
              + Agregar Fecha
            </button>
          </div>
        )}

        {activeTab==="historial"&&(
          <div>
            {fechas.map(f=>{
              const dr=Object.entries(f.resultados).sort(([,a],[,b])=>b-a);
              return (
                <div key={f.id} style={{marginBottom:"20px",borderRadius:"12px",border:`1px solid ${f.es_playoff?"rgba(168,127,232,0.3)":"rgba(200,168,75,0.2)"}`,overflow:"hidden",background:"rgba(255,255,255,0.03)"}}>
                  <div style={{padding:"12px 16px",background:f.es_playoff?"rgba(168,127,232,0.1)":"rgba(200,168,75,0.1)",borderBottom:`1px solid ${f.es_playoff?"rgba(168,127,232,0.2)":"rgba(200,168,75,0.2)"}`,fontSize:"14px",fontWeight:"bold",letterSpacing:"2px",color:f.es_playoff?"#a87fe8":"#c8a84b"}}>
                    📅 {f.nombre}{f.es_playoff?" ⚔️ PLAYOFF":""}
                  </div>
                  {dr.map(([name,pts],rank)=>(
                    <div key={name} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <span style={{width:"24px",color:rank<3?trophyColors[rank]:"#667",fontWeight:"bold"}}>{rank<3?trophyEmoji[rank]:`${rank+1}.`}</span>
                      <span style={{flex:1}}>{name}</span>
                      <span style={{color:f.es_playoff?"#a87fe8":"#c8a84b",fontWeight:"bold"}}>{pts} pts</span>
                      {f.daily_wins[name]>0&&<span style={{fontSize:"11px",color:"#4bc87a"}}>🏆</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {activeTab==="playoffs"&&(
          <div>
            <div style={{marginBottom:16,padding:"14px 16px",borderRadius:10,background:"rgba(168,127,232,0.08)",border:"1px solid rgba(168,127,232,0.25)"}}>
              <div style={{fontSize:13,color:"#a87fe8",letterSpacing:2,fontWeight:"bold",marginBottom:6}}>⚔️ PLAYOFFS</div>
              <div style={{fontSize:12,color:"#778",lineHeight:1.8}}>
                Clasifican todos con <strong style={{color:"#e8dcc8"}}>mínimo 6 fechas jugadas</strong>.<br/>
                Top 8 puntajes · Playoffs valen <strong style={{color:"#a87fe8"}}>×2</strong>.
              </div>
            </div>
            <div style={{fontSize:11,color:"#c8a84b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Clasificados ({qualified.length})</div>
            {qualified.length===0&&<div style={{padding:16,color:"#556",fontSize:13,textAlign:"center"}}>Nadie clasifica aún.</div>}
            {qualified.map((p,i)=>(
              <div key={p.name} style={{display:"flex",alignItems:"center",padding:"12px 16px",marginBottom:6,borderRadius:10,background:"rgba(168,127,232,0.06)",border:"1px solid rgba(168,127,232,0.2)"}}>
                <span style={{width:32,fontSize:i<3?20:14,color:i<3?trophyColors[i]:"#778"}}>{i<3?trophyEmoji[i]:`#${i+1}`}</span>
                <span style={{flex:1,fontSize:14}}>{p.name}</span>
                <span style={{color:"#a87fe8",fontWeight:"bold"}}>{p.total} pts</span>
              </div>
            ))}
            <button onClick={()=>{setNewIsPlayoff(true);setShowAddDate(true);setActiveTab("ranking");}}
              style={{width:"100%",marginTop:20,padding:"14px",background:"rgba(168,127,232,0.15)",border:"2px dashed rgba(168,127,232,0.4)",borderRadius:"12px",color:"#a87fe8",fontSize:"14px",letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>
              + Agregar Fecha Playoff
            </button>
          </div>
        )}

        {activeTab==="final"&&(
          <div>
            <div style={{marginBottom:16,padding:"14px 16px",borderRadius:10,background:"rgba(200,75,75,0.08)",border:"1px solid rgba(200,75,75,0.25)"}}>
              <div style={{fontSize:13,color:"#e87f7f",letterSpacing:2,fontWeight:"bold",marginBottom:6}}>🏁 RONDA FINAL — STROKE PLAY</div>
              <div style={{fontSize:12,color:"#778",lineHeight:1.8}}>
                Score bruto − handicap = score neto.<br/>
                Menor score neto gana.<br/>
                Reparto: <strong style={{color:"#c8a84b"}}>1° 60% · 2° 30% · 3° 10%</strong>
              </div>
            </div>
            <div style={{fontSize:11,color:"#c8a84b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Handicaps</div>
            <div style={{marginBottom:16,borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden"}}>
              {qualified.length===0&&<div style={{padding:14,color:"#556",fontSize:13}}>No hay clasificados aún.</div>}
              {qualified.map((p,i)=>(
                <div key={p.name} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.03)"}}>
                  <span style={{width:28,color:"#667",fontSize:12}}>{i+1}°</span>
                  <span style={{flex:1,fontSize:13}}>{p.name}</span>
                  <span style={{color:"#e87f7f",fontSize:13}}>-{FINAL_HANDICAP[i+1]??0} golpes</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:"#c8a84b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Scores brutos</div>
            <div style={{borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden",marginBottom:16}}>
              {qualified.map((p,i)=>(
                <div key={p.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.03)"}}>
                  <span style={{width:28,color:"#667",fontSize:12}}>{i+1}°</span>
                  <span style={{flex:1,fontSize:13}}>{p.name}</span>
                  <input type="number" min="50" max="130" placeholder="score"
                    value={finalScores[p.name]??""}
                    onChange={e=>setFinalScores(prev=>({...prev,[p.name]:e.target.value}))}
                    style={{width:72,padding:"7px 8px",borderRadius:8,background:"rgba(0,0,0,0.5)",border:"1px solid rgba(200,168,75,0.3)",color:"#c8a84b",fontSize:16,textAlign:"center",fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            {finalResults.length>0&&(
              <>
                <div style={{fontSize:11,color:"#c8a84b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Resultados netos</div>
                <div style={{borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden",marginBottom:16}}>
                  {finalResults.map((p,i)=>(
                    <div key={p.name} style={{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:i===0?"rgba(255,215,0,0.06)":i===1?"rgba(192,192,192,0.04)":i===2?"rgba(205,127,50,0.04)":"rgba(255,255,255,0.02)"}}>
                      <span style={{width:32,fontSize:i<3?20:14,color:i<3?trophyColors[i]:"#667"}}>{i<3?trophyEmoji[i]:`${i+1}.`}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,color:i<3?trophyColors[i]:"#e8dcc8"}}>{p.name}</div>
                        <div style={{fontSize:11,color:"#667"}}>{p.gross} − {p.hcp} = <strong style={{color:"#e8dcc8"}}>{p.net}</strong></div>
                      </div>
                      <span style={{fontSize:22,fontWeight:"bold",color:i<3?trophyColors[i]:"#c8a84b"}}>{p.net}</span>
                    </div>
                  ))}
                </div>
                {!finalClosed?(
                  <button onClick={()=>setFinalClosed(true)}
                    style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#c84b4b,#8b2020)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>
                    🏁 CERRAR TORNEO Y REPARTIR POZO
                  </button>
                ):(
                  <div style={{borderRadius:12,border:"2px solid rgba(200,168,75,0.4)",padding:"20px 16px",background:"rgba(200,168,75,0.06)",textAlign:"center"}}>
                    <div style={{fontSize:16,color:"#c8a84b",letterSpacing:3,marginBottom:16,fontWeight:"bold"}}>🏆 CAMPEONES HOLI CUP 2026 🏆</div>
                    {prizes.map((p,i)=>(
                      <div key={p.name} style={{display:"flex",alignItems:"center",padding:"12px 0",borderBottom:i<prizes.length-1?"1px solid rgba(200,168,75,0.15)":"none"}}>
                        <span style={{fontSize:24,marginRight:12}}>{trophyEmoji[i]}</span>
                        <span style={{flex:1,fontSize:16,color:trophyColors[i],fontWeight:"bold"}}>{p.name}</span>
                        <span style={{fontSize:20,color:"#c8a84b",fontWeight:"bold"}}>${p.prize}</span>
                      </div>
                    ))}
                    <div style={{marginTop:14,fontSize:11,color:"#556"}}>Pozo: ${pot} · 60/30/10%</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab==="reglas"&&(
          <div style={{lineHeight:1.8}}>
            {[
              {title:"💰 Cuota",content:"$10 por jugador por fecha. Pot diario opcional."},
              {title:"🏆 Puntos",content:"Top 8 resultados de cada jugador cuentan para el ranking."},
              {title:"⚔️ Playoffs",content:"Fechas de playoff valen ×2. Clasifican todos con mínimo 6 fechas."},
              {title:"🤝 Empates",content:"Se suman los puntos de las posiciones empatadas y se dividen equitativamente."},
              {title:"🚫 No-shows",content:"El que no juega, no paga ni gana puntos."},
              {title:"🏁 Final",content:"Stroke play. 1° recibe 6 golpes de ventaja, 2° cinco, 3° cuatro, 4° tres, 5° dos, 6° uno."},
              {title:"💵 Reparto",content:"1° recibe 60%, 2° recibe 30%, 3° recibe 10% del pozo."},
            ].map(r=>(
              <div key={r.title} style={{marginBottom:"12px",padding:"16px",borderRadius:"10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,168,75,0.15)"}}>
                <div style={{fontWeight:"bold",color:"#c8a84b",marginBottom:"6px"}}>{r.title}</div>
                <div style={{color:"#bbb",fontSize:"14px"}}>{r.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddDate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}}>
          <div style={{background:"#0d2137",border:"1px solid rgba(200,168,75,0.3)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"700px",maxHeight:"90vh",overflowY:"auto",padding:"24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <h2 style={{margin:0,color:newIsPlayoff?"#a87fe8":"#c8a84b",fontSize:"18px"}}>
                {newIsPlayoff?"⚔️":"📅"} Fecha {fechas.length+1}{newIsPlayoff?" — PLAYOFF":""}
              </h2>
              <button onClick={()=>{setShowAddDate(false);setNewIsPlayoff(false);}} style={{background:"none",border:"none",color:"#888",fontSize:"24px",cursor:"pointer"}}>✕</button>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 14px",borderRadius:8,background:"rgba(168,127,232,0.08)",border:"1px solid rgba(168,127,232,0.2)",cursor:"pointer"}}>
              <input type="checkbox" checked={newIsPlayoff} onChange={e=>setNewIsPlayoff(e.target.checked)} style={{width:16,height:16}}/>
              <span style={{fontSize:13,color:"#a87fe8"}}>⚔️ Fecha de <strong>Playoff</strong> (×2)</span>
            </label>
            {ALL_PLAYERS.map(p=>(
              <div key={p} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px",padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:"8px"}}>
                <span style={{flex:1,fontSize:"14px"}}>{p}</span>
                <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"12px",color:"#888"}}>
                  <input type="checkbox" checked={!!newPaid[p]} onChange={e=>setNewPaid(prev=>({...prev,[p]:e.target.checked}))}/> Pagó
                </label>
                <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"12px",color:"#4bc87a"}}>
                  <input type="radio" name="winner" checked={newWinner===p} onChange={()=>setNewWinner(p)}/> 🏆
                </label>
                <input type="number" min="0" value={newResults[p]??""} onChange={e=>setNewResults(prev=>({...prev,[p]:e.target.value}))} placeholder="pts"
                  style={{width:"64px",padding:"6px 8px",borderRadius:"6px",background:"rgba(0,0,0,0.4)",border:`1px solid ${newIsPlayoff?"rgba(168,127,232,0.4)":"rgba(200,168,75,0.3)"}`,color:newIsPlayoff?"#a87fe8":"#c8a84b",fontSize:"16px",textAlign:"center"}}/>
              </div>
            ))}
            <button onClick={handleAddDate} style={{width:"100%",marginTop:"16px",padding:"16px",background:newIsPlayoff?"linear-gradient(135deg,#7b4fa8,#5a2d8a)":"linear-gradient(135deg,#c8a84b,#a8882b)",border:"none",borderRadius:"10px",color:"#fff",fontSize:"16px",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",letterSpacing:"2px"}}>
              GUARDAR FECHA
            </button>
          </div>
        </div>
      )}

      <div style={{textAlign:"center",padding:"20px",color:"#444",fontSize:"11px",letterSpacing:"1px"}}>ACARREOS HOLI CUP © 2026</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
